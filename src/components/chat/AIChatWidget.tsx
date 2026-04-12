import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, X, MessageSquare, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string; sources?: Source[] };
type Source = { document_id: string; title: string; short_title?: string | null; section?: string; url: string };

const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const GUEST_KEY = 'babijon_guest_ai_count';
const GUEST_LIMIT = 2;

function getGuestCount(): number {
  try { return parseInt(localStorage.getItem(GUEST_KEY) || '0', 10); } catch { return 0; }
}
function incrementGuestCount() {
  try { localStorage.setItem(GUEST_KEY, String(getGuestCount() + 1)); } catch {}
}

function BounceDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export function AIChatWidget() {
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  // Allow opening from external components via custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [requestsUsed, setRequestsUsed] = useState(0);
  const [requestsLimit, setRequestsLimit] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect context document from URL
  const contextMatch = location.pathname.match(/\/(?:app\/)?documents\/([a-f0-9-]+)/);
  const contextDocumentId = contextMatch?.[1] || null;
  const [contextLabel, setContextLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!contextDocumentId) { setContextLabel(null); return; }
    supabase.from('documents').select('short_title, title').eq('id', contextDocumentId).single()
      .then(({ data }) => {
        if (data) setContextLabel(data.short_title || data.title);
      });
  }, [contextDocumentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check guest limit on mount
  useEffect(() => {
    if (!user) setGuestLimitReached(getGuestCount() >= GUEST_LIMIT);
  }, [user]);

  // Load last conversation when widget opens (authenticated only)
  useEffect(() => {
    if (!open || !user) return;
    if (conversationId || messages.length > 0) return; // already have data

    (async () => {
      const { data: convs } = await supabase
        .from('assistant_conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (!convs || convs.length === 0) return;
      const lastConvId = convs[0].id;

      const { data: msgs } = await supabase
        .from('assistant_messages')
        .select('role, content, sources')
        .eq('conversation_id', lastConvId)
        .order('created_at', { ascending: true });

      if (msgs && msgs.length > 0) {
        setConversationId(lastConvId);
        setMessages(msgs.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: (m.sources as any) || undefined,
        })));
      }
    })();
  }, [open, user]);

  const startNew = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setLimitReached(false);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    // Input length limit (match server-side)
    if (text.length > 2000) {
      toast({ title: 'Слишком длинный вопрос', description: 'Максимум 2000 символов', variant: 'destructive' });
      return;
    }

    // Guest mode check
    if (!user) {
      if (getGuestCount() >= GUEST_LIMIT) {
        setGuestLimitReached(true);
        return;
      }
    }

    if (user && limitReached) return;

    setInput('');
    setMessages(p => [...p, { role: 'user', content: text }]);
    setIsStreaming(true);

    // For authenticated users — create conversation & call API
    if (user && session) {
      let convId = conversationId;
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
          body: JSON.stringify({
            question: text,
            session_id: convId,
            context_document_id: contextDocumentId,
          }),
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          if (body.error === 'limit_exceeded') {
            setLimitReached(true);
            setRequestsUsed(body.requests_used || 0);
            setRequestsLimit(body.requests_limit || 5);
          }
          toast({ title: body.message || body.error || 'Ошибка сервера', variant: 'destructive' });
          setIsStreaming(false);
          return;
        }

        if (!resp.body) { setIsStreaming(false); return; }

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
              if (p.sources) {
                sources = p.sources;
                if (p.requests_used != null) setRequestsUsed(p.requests_used);
                if (p.requests_limit != null) setRequestsLimit(p.requests_limit);
                continue;
              }
              const c = p.choices?.[0]?.delta?.content as string | undefined;
              if (c) {
                assistantText += c;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText, sources } : m);
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
        // Track AI usage
        supabase.from('usage_tracking').insert({ user_id: user.id, feature: 'ai_chat' }).then();
      } catch {
        setIsStreaming(false);
        toast({ title: 'Ошибка соединения', variant: 'destructive' });
      }
    } else {
      // Guest mode — call without auth, simple response
      try {
        const resp = await fetch(ASSISTANT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, guest: true }),
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          toast({ title: body.message || 'Ошибка', variant: 'destructive' });
          setIsStreaming(false);
          return;
        }

        if (!resp.body) { setIsStreaming(false); return; }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let assistantText = '';
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
              if (c) {
                assistantText += c;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                  }
                  return [...prev, { role: 'assistant', content: assistantText }];
                });
              }
            } catch {
              buf = line + '\n' + buf;
              break;
            }
          }
        }

        incrementGuestCount();
        if (getGuestCount() >= GUEST_LIMIT) {
          setGuestLimitReached(true);
          setMessages(prev => [...prev, {
            role: 'system',
            content: '🔒 Вы использовали все пробные вопросы.\nЗарегистрируйтесь, чтобы продолжить.',
          }]);
        }
        setIsStreaming(false);
      } catch {
        setIsStreaming(false);
        toast({ title: 'Ошибка соединения', variant: 'destructive' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isDisabled = isStreaming || (user ? limitReached : guestLimitReached);

  // Don't show on auth pages
  if (location.pathname.startsWith('/auth')) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Открыть AI-ассистент"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div
          className={`fixed z-50 bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden ${
            isMobile ? 'inset-0 rounded-none w-full h-full' : 'bottom-6 right-6 w-[400px] h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI-помощник</p>
                {user && requestsLimit !== null && (
                  <p className="text-[10px] text-muted-foreground">
                    Запросов: {requestsUsed}/{requestsLimit}
                  </p>
                )}
                {!user && (
                  <p className="text-[10px] text-muted-foreground">
                    {getGuestCount()}/{GUEST_LIMIT} бесплатных вопросов
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNew} title="Новый диалог">
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Context badge */}
          {contextDocumentId && contextLabel && (
            <div className="px-3 py-1.5 bg-muted/50 border-b flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">Контекст: {contextLabel}</span>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {messages.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <Bot className="h-10 w-10 text-primary/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">Задайте вопрос о законодательстве РБ</p>
                  {!user && (
                    <p className="text-xs text-muted-foreground">
                      {GUEST_LIMIT - getGuestCount()} вопрос{GUEST_LIMIT - getGuestCount() === 1 ? '' : 'а'} без регистрации
                    </p>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                      msg.role === 'system' ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      {msg.role === 'system' ? <Lock className="h-3.5 w-3.5 text-destructive" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground'
                    : msg.role === 'system' ? 'bg-destructive/5 border border-destructive/20'
                    : 'bg-muted'
                  }`}>
                    {msg.role === 'system' ? (
                      <div className="space-y-2">
                        <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex gap-2">
                          <Link to="/auth" onClick={() => setOpen(false)}>
                            <Button size="sm" className="h-7 text-xs">Зарегистрироваться</Button>
                          </Link>
                          <Link to="/auth" onClick={() => setOpen(false)}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Войти</Button>
                          </Link>
                        </div>
                      </div>
                    ) : msg.role === 'assistant' ? (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 text-xs">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => {
                                if (href?.startsWith('/')) {
                                  return (
                                    <a
                                      href={href}
                                      className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setOpen(false);
                                        navigate(href);
                                      }}
                                    >
                                      {children}
                                    </a>
                                  );
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-border/50 flex flex-wrap gap-1">
                            {msg.sources.slice(0, 5).map((s, j) => (
                              <Link
                                key={j}
                                to={s.url}
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 hover:bg-primary/10"
                              >
                                📄 {s.section || s.short_title || s.title?.slice(0, 30)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-xl"><BounceDots /></div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Limit banner for authenticated */}
          {user && limitReached && (
            <div className="px-3 py-2 bg-destructive/10 border-t text-center">
              <p className="text-xs text-destructive mb-1">Лимит исчерпан ({requestsUsed}/{requestsLimit})</p>
              <Link to="/pricing" onClick={() => setOpen(false)}>
                <Button size="sm" variant="default" className="h-7 text-xs">Улучшить тариф</Button>
              </Link>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                placeholder={isDisabled ? 'Лимит исчерпан' : 'Задайте вопрос...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="min-h-[36px] max-h-[80px] resize-none text-sm"
                disabled={isDisabled}
              />
              <Button
                onClick={send}
                disabled={!input.trim() || isDisabled}
                size="icon"
                className="shrink-0 h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1">
              AI может ошибаться. Проверяйте информацию.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
