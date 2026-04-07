import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, X, MessageSquare, FileText, Lock } from 'lucide-react';
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
        <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'hsl(var(--gray-400))', animationDelay: `${i * 0.15}s` }} />
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

  const contextMatch = location.pathname.match(/\/(?:app\/)?documents\/([a-f0-9-]+)/);
  const contextDocumentId = contextMatch?.[1] || null;
  const [contextLabel, setContextLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!contextDocumentId) { setContextLabel(null); return; }
    supabase.from('documents').select('short_title, title').eq('id', contextDocumentId).single()
      .then(({ data }) => { if (data) setContextLabel(data.short_title || data.title); });
  }, [contextDocumentId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => { if (!user) setGuestLimitReached(getGuestCount() >= GUEST_LIMIT); }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    if (conversationId || messages.length > 0) return;
    (async () => {
      const { data: convs } = await supabase.from('assistant_conversations').select('id').eq('user_id', user.id).order('last_message_at', { ascending: false }).limit(1);
      if (!convs || convs.length === 0) return;
      const lastConvId = convs[0].id;
      const { data: msgs } = await supabase.from('assistant_messages').select('role, content, sources').eq('conversation_id', lastConvId).order('created_at', { ascending: true });
      if (msgs && msgs.length > 0) {
        setConversationId(lastConvId);
        setMessages(msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content, sources: (m.sources as any) || undefined })));
      }
    })();
  }, [open, user]);

  const startNew = useCallback(() => { setConversationId(null); setMessages([]); setInput(''); setLimitReached(false); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (text.length > 2000) { toast({ title: 'Слишком длинный вопрос', description: 'Максимум 2000 символов', variant: 'destructive' }); return; }
    if (!user && getGuestCount() >= GUEST_LIMIT) { setGuestLimitReached(true); return; }
    if (user && limitReached) return;

    setInput('');
    setMessages(p => [...p, { role: 'user', content: text }]);
    setIsStreaming(true);

    if (user && session) {
      let convId = conversationId;
      if (!convId) {
        const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
        const { data, error } = await supabase.from('assistant_conversations').insert({ user_id: user.id, title }).select('id').single();
        if (error || !data) { toast({ title: 'Ошибка создания диалога', variant: 'destructive' }); setIsStreaming(false); return; }
        convId = data.id;
        setConversationId(convId);
      }

      try {
        const resp = await fetch(ASSISTANT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ question: text, session_id: convId, context_document_id: contextDocumentId }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          if (body.error === 'limit_exceeded') { setLimitReached(true); setRequestsUsed(body.requests_used || 0); setRequestsLimit(body.requests_limit || 5); }
          toast({ title: body.message || body.error || 'Ошибка сервера', variant: 'destructive' });
          setIsStreaming(false); return;
        }
        if (!resp.body) { setIsStreaming(false); return; }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', assistantText = '', sources: Source[] = [], done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') { done = true; break; }
            try {
              const p = JSON.parse(json);
              if (p.sources) { sources = p.sources; if (p.requests_used != null) setRequestsUsed(p.requests_used); if (p.requests_limit != null) setRequestsLimit(p.requests_limit); continue; }
              const c = p.choices?.[0]?.delta?.content as string | undefined;
              if (c) {
                assistantText += c;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText, sources } : m);
                  return [...prev, { role: 'assistant', content: assistantText, sources }];
                });
              }
            } catch { buf = line + '\n' + buf; break; }
          }
        }
        setIsStreaming(false);
      } catch { setIsStreaming(false); toast({ title: 'Ошибка соединения', variant: 'destructive' }); }
    } else {
      try {
        const resp = await fetch(ASSISTANT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, guest: true }) });
        if (!resp.ok) { const body = await resp.json().catch(() => ({})); toast({ title: body.message || 'Ошибка', variant: 'destructive' }); setIsStreaming(false); return; }
        if (!resp.body) { setIsStreaming(false); return; }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', assistantText = '', done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
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
                  if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                  return [...prev, { role: 'assistant', content: assistantText }];
                });
              }
            } catch { buf = line + '\n' + buf; break; }
          }
        }
        incrementGuestCount();
        if (getGuestCount() >= GUEST_LIMIT) {
          setGuestLimitReached(true);
          setMessages(prev => [...prev, { role: 'system', content: '🔒 Вы использовали 2 бесплатных вопроса.\nЗарегистрируйтесь, чтобы получить 3 вопроса в день бесплатно.' }]);
        }
        setIsStreaming(false);
      } catch { setIsStreaming(false); toast({ title: 'Ошибка соединения', variant: 'destructive' }); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const isDisabled = isStreaming || (user ? limitReached : guestLimitReached);

  if (location.pathname.startsWith('/auth')) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all"
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'hsl(var(--navy-900))', color: 'white',
            boxShadow: '0 4px 12px rgba(27,42,74,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          aria-label="Открыть AI-ассистент"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden ${isMobile ? 'inset-0' : 'bottom-6 right-6 w-[400px] h-[600px]'}`}
          style={{
            background: 'white',
            borderRadius: isMobile ? 0 : 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: 'hsl(var(--navy-900))',
              color: 'white',
              borderRadius: isMobile ? 0 : '20px 20px 0 0',
            }}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>AI-помощник Бабиджон</p>
                {user && requestsLimit !== null && (
                  <p style={{ fontSize: 10, opacity: 0.7 }}>Запросов: {requestsUsed}/{requestsLimit}</p>
                )}
                {!user && (
                  <p style={{ fontSize: 10, opacity: 0.7 }}>{getGuestCount()}/{GUEST_LIMIT} бесплатных</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={startNew} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" title="Новый диалог">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context badge */}
          {contextDocumentId && contextLabel && (
            <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: 'hsl(var(--gray-50))', borderBottom: '1px solid hsl(var(--gray-200))' }}>
              <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--navy-600))' }} />
              <span className="text-xs truncate" style={{ color: 'hsl(var(--gray-600))' }}>Контекст: {contextLabel}</span>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {messages.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <Bot className="h-10 w-10 mx-auto" style={{ color: 'hsl(var(--gray-200))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--gray-600))' }}>Задайте вопрос о законодательстве РБ</p>
                  {!user && <p className="text-xs" style={{ color: 'hsl(var(--gray-400))' }}>Попробуйте бесплатно — {GUEST_LIMIT - getGuestCount()} без регистрации</p>}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5" style={{ background: msg.role === 'system' ? 'hsl(var(--red-bg))' : 'hsl(var(--gray-50))' }}>
                      {msg.role === 'system' ? <Lock className="h-3.5 w-3.5" style={{ color: 'hsl(var(--red-text))' }} /> : <Bot className="h-3.5 w-3.5" style={{ color: 'hsl(var(--navy-600))' }} />}
                    </div>
                  )}
                  <div
                    className="max-w-[85%] px-3 py-2 text-sm"
                    style={{
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'hsl(var(--navy-900))' : msg.role === 'system' ? 'hsl(var(--red-bg))' : 'hsl(var(--gray-50))',
                      color: msg.role === 'user' ? 'white' : 'hsl(var(--gray-900))',
                    }}
                  >
                    {msg.role === 'system' ? (
                      <div className="space-y-2">
                        <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex gap-2">
                          <Link to="/auth" onClick={() => setOpen(false)}>
                            <button className="btn-primary text-xs" style={{ padding: '4px 14px' }}>Зарегистрироваться</button>
                          </Link>
                          <Link to="/auth" onClick={() => setOpen(false)}>
                            <button className="btn-secondary text-xs" style={{ padding: '4px 14px', color: 'hsl(var(--gray-900))', borderColor: 'hsl(var(--gray-200))' }}>Войти</button>
                          </Link>
                        </div>
                      </div>
                    ) : msg.role === 'assistant' ? (
                      <>
                        <div className="prose prose-sm max-w-none text-xs [&>p]:mb-1.5 [&>ul]:mb-1.5">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => {
                                if (href?.startsWith('/')) {
                                  return <a href={href} className="underline underline-offset-2 cursor-pointer" style={{ color: 'hsl(var(--navy-600))' }} onClick={(e) => { e.preventDefault(); setOpen(false); navigate(href); }}>{children}</a>;
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'hsl(var(--navy-600))' }}>{children}</a>;
                              },
                            }}
                          >{msg.content}</ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-1.5 flex flex-wrap gap-1" style={{ borderTop: '1px solid hsl(var(--gray-200))' }}>
                            {msg.sources.slice(0, 5).map((s, j) => (
                              <Link
                                key={j}
                                to={s.url}
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 transition-colors"
                                style={{ background: 'hsl(var(--navy-50))', color: 'hsl(var(--navy-700))' }}
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
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'hsl(var(--navy-900))' }}>
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2">
                  <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--gray-50))' }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: 'hsl(var(--navy-600))' }} />
                  </div>
                  <div style={{ background: 'hsl(var(--gray-50))', borderRadius: '16px 16px 16px 4px' }}><BounceDots /></div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Limit banner */}
          {user && limitReached && (
            <div className="px-3 py-2 text-center" style={{ background: 'hsl(var(--red-bg))' }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(var(--red-text))' }}>Лимит исчерпан ({requestsUsed}/{requestsLimit})</p>
              <Link to="/pricing" onClick={() => setOpen(false)}>
                <button className="btn-primary text-xs" style={{ padding: '4px 16px' }}>Улучшить тариф</button>
              </Link>
            </div>
          )}

          {/* Input */}
          <div className="p-3" style={{ borderTop: '1px solid hsl(var(--gray-200))' }}>
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder={isDisabled ? 'Лимит исчерпан' : 'Задайте вопрос...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="min-h-[36px] max-h-[80px] resize-none text-sm"
                style={{
                  border: '2px solid hsl(var(--gray-200))',
                  borderRadius: 12,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                disabled={isDisabled}
              />
              <button
                onClick={send}
                disabled={!input.trim() || isDisabled}
                className="shrink-0 flex items-center justify-center transition-all"
                style={{
                  width: 36, height: 36,
                  background: !input.trim() || isDisabled ? 'hsl(var(--gray-200))' : 'hsl(var(--amber-500))',
                  borderRadius: 10,
                  color: 'hsl(var(--navy-900))',
                  cursor: !input.trim() || isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center mt-1" style={{ fontSize: 9, color: 'hsl(var(--gray-400))' }}>
              AI может ошибаться. Проверяйте информацию.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
