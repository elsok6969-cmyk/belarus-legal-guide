import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || 'Ошибка сервера');
    return;
  }

  if (!resp.body) { onError('Нет данных'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content as string | undefined;
        if (c) onDelta(c);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

export default function AIChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation list
  const { data: conversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_message_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Load messages when conversation selected
  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    supabase
      .from('assistant_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .then(({ data }) => {
        if (data) setMessages(data.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      });
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessage = async (convId: string, role: string, content: string) => {
    await supabase.from('assistant_messages').insert({ conversation_id: convId, role, content });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming || !user) return;

    const userMsg: Msg = { role: 'user', content: text };
    setInput('');
    setMessages((p) => [...p, userMsg]);
    setIsStreaming(true);

    let convId = conversationId;

    // Create conversation if needed
    if (!convId) {
      const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
      const { data, error } = await supabase
        .from('assistant_conversations')
        .insert({ user_id: user.id, title })
        .select('id')
        .single();
      if (error || !data) {
        toast({ title: 'Ошибка создания диалога', variant: 'destructive' });
        setIsStreaming(false);
        return;
      }
      convId = data.id;
      setConversationId(convId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }

    await saveMessage(convId, 'user', text);

    let assistantText = '';
    const allMsgs = [...messages, userMsg];

    await streamChat({
      messages: allMsgs,
      onDelta: (chunk) => {
        assistantText += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          }
          return [...prev, { role: 'assistant', content: assistantText }];
        });
      },
      onDone: async () => {
        setIsStreaming(false);
        if (assistantText) {
          await saveMessage(convId!, 'assistant', assistantText);
          await supabase
            .from('assistant_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', convId!);
        }
      },
      onError: (msg) => {
        setIsStreaming(false);
        toast({ title: msg, variant: 'destructive' });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const startNew = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Sidebar - conversations */}
      <div className="w-64 shrink-0 flex flex-col border rounded-lg bg-card overflow-hidden hidden md:flex">
        <div className="p-3 border-b">
          <Button onClick={startNew} className="w-full" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Новый диалог
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => setConversationId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                  conversationId === c.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                {c.title || 'Без названия'}
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Нет диалогов</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">AI Ассистент</h1>
            <p className="text-xs text-muted-foreground">
              Вопросы по законодательству РБ • Не является юридической консультацией
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={startNew} className="md:hidden">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <Bot className="h-12 w-12 text-primary/30 mx-auto" />
                <p className="text-muted-foreground text-sm">
                  Задайте вопрос по законодательству Республики Беларусь
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {[
                    'Какие налоги платит ИП?',
                    'Срок исковой давности по ГК',
                    'Порядок регистрации ООО',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                      className="text-xs border rounded-full px-3 py-1.5 hover:bg-accent transition-colors text-muted-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              ref={textareaRef}
              placeholder="Введите вопрос..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isStreaming}
            />
            <Button onClick={send} disabled={!input.trim() || isStreaming} size="icon" className="shrink-0">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            AI может ошибаться. Проверяйте информацию в первоисточниках.
          </p>
        </div>
      </div>
    </div>
  );
}
