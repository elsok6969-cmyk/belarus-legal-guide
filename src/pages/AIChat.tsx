import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, MessageSquare, Scale, BookOpen, Building2, Receipt, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string; sources?: Source[] };
type Source = { id: string; title: string; slug: string; doc_type?: string };

const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const EXAMPLES = [
  { icon: Receipt, text: 'Какой срок сдачи декларации по НДС?' },
  { icon: Calculator, text: 'Как рассчитать отпускные в Беларуси?' },
  { icon: FileText, text: 'Требования к трудовому договору' },
  { icon: Building2, text: 'Ставки подоходного налога для ИП' },
  { icon: BookOpen, text: 'Как открыть ООО в Беларуси?' },
  { icon: Scale, text: 'Что такое УСН и кому подходит?' },
];

function BounceDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-1">Источники:</p>
      <div className="flex flex-wrap gap-1">
        {sources.map((s) => (
          <Link
            key={s.id}
            to={`/documents/${s.slug || s.id}`}
            className="text-xs text-primary hover:underline bg-primary/5 rounded px-2 py-0.5"
          >
            {s.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [requestsUsed, setRequestsUsed] = useState(0);
  const [requestsLimit, setRequestsLimit] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?return=/ai-assistant');
    }
  }, [authLoading, user, navigate]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNew = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setLimitReached(false);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming || !user || !session) return;

    setInput('');
    setMessages((p) => [...p, { role: 'user', content: text }]);
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
    }

    try {
      const resp = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question: text, session_id: convId }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        if (body.error === 'limit_exceeded') {
          setLimitReached(true);
          setRequestsUsed(body.requests_used || 0);
          setRequestsLimit(body.requests_limit || 5);
          toast({ title: body.message, variant: 'destructive' });
        } else if (resp.status === 401) {
          navigate('/auth?return=/ai-assistant');
        } else {
          toast({ title: body.error || 'Ошибка сервера', variant: 'destructive' });
        }
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let assistantText = '';
      let sources: Source[] = [];
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

            // First event contains sources metadata
            if (p.sources) {
              sources = p.sources;
              if (p.requests_used != null) setRequestsUsed(p.requests_used);
              if (p.requests_limit != null) setRequestsLimit(p.requests_limit);
              continue;
            }

            const c = p.choices?.[0]?.delta?.content as string | undefined;
            if (c) {
              assistantText += c;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantText, sources } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantText, sources }];
              });
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
      setIsStreaming(false);
    } catch {
      setIsStreaming(false);
      toast({ title: 'Ошибка соединения. Попробуйте ещё раз', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-4 bg-card rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI-ассистент</h1>
            <p className="text-xs text-muted-foreground">
              Вопросы по законодательству РБ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {requestsLimit !== null && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{requestsUsed}/{requestsLimit}</span>
              <Progress
                value={(requestsUsed / requestsLimit) * 100}
                className="w-20 h-1.5"
              />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={startNew}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Новый диалог
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-card">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="py-12 space-y-6">
              <div className="text-center space-y-2">
                <Bot className="h-14 w-14 text-primary/20 mx-auto" />
                <h2 className="text-lg font-medium text-foreground">Примеры вопросов</h2>
                <p className="text-sm text-muted-foreground">
                  Нажмите на карточку или введите свой вопрос
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto">
                {EXAMPLES.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => {
                      setInput(text);
                      textareaRef.current?.focus();
                    }}
                    className="flex flex-col gap-2 items-start p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-left text-sm"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground leading-tight">{text}</span>
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
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && <SourcesList sources={msg.sources} />}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center mt-1">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-xl">
                <BounceDots />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Limit banner */}
      {limitReached && (
        <div className="px-4 py-3 bg-destructive/10 border-t flex items-center justify-between">
          <p className="text-sm text-destructive">
            Лимит исчерпан ({requestsUsed}/{requestsLimit} запросов).
          </p>
          <Link to="/pricing">
            <Button size="sm" variant="default">Улучшить тариф →</Button>
          </Link>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-card rounded-b-lg">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            placeholder="Задайте вопрос о законодательстве Беларуси..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isStreaming || limitReached}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || isStreaming || limitReached}
            size="icon"
            className="shrink-0 bg-teal-600 hover:bg-teal-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI может ошибаться. Проверяйте информацию в первоисточниках.
        </p>
      </div>
    </div>
  );
}
