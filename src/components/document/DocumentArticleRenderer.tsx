import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Bot, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleRendererProps {
  id: string;
  title: string | null;
  number: string | null;
  content: string;
  level: number;
  searchQuery?: string;
  onArticleClick?: (articleNum: string) => void;
  onAIExplain?: (title: string, content: string) => void;
}

const AMENDMENT_RE = /\(в\s+ред\.\s+.+?\)/gi;
const ARTICLE_REF_RE = /(?:стать[яиейю]|ст\.)\s*(\d+(?:[.-]\d+)?)/gi;

function highlightSearch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} style={{ background: 'hsl(var(--yellow-bg))', color: 'hsl(var(--yellow-text))', padding: '0 2px', borderRadius: 2 }}>{part}</mark> : part
  );
}

function processContent(
  content: string,
  searchQuery?: string,
  onArticleClick?: (num: string) => void
): React.ReactNode[] {
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    const isAmendment = AMENDMENT_RE.test(line);
    AMENDMENT_RE.lastIndex = 0;

    if (isAmendment) {
      result.push(
        <div
          key={i}
          className="my-3"
          style={{
            fontSize: 14,
            color: 'hsl(var(--gray-400))',
            fontStyle: 'italic',
            borderLeft: '3px solid hsl(var(--gray-200))',
            paddingLeft: 12,
          }}
        >
          {highlightSearch(line, searchQuery || '')}
        </div>
      );
      continue;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    const refRegex = new RegExp(ARTICLE_REF_RE.source, 'gi');

    while ((match = refRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(highlightSearch(line.slice(lastIndex, match.index), searchQuery || ''));
      }
      const artNum = match[1];
      parts.push(
        <button
          key={`ref-${i}-${match.index}`}
          onClick={() => onArticleClick?.(artNum)}
          className="underline decoration-dotted underline-offset-2 cursor-pointer transition-colors"
          style={{ color: 'hsl(var(--navy-600))' }}
        >
          {highlightSearch(match[0], searchQuery || '')}
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      parts.push(highlightSearch(line.slice(lastIndex), searchQuery || ''));
    }

    result.push(
      <p key={i} style={{ marginBottom: 6, lineHeight: 1.8 }}>
        {parts.length > 0 ? parts : highlightSearch(line, searchQuery || '')}
      </p>
    );
  }

  return result;
}

export function DocumentArticleRenderer({
  id, title, number, content, level, searchQuery, onArticleClick, onAIExplain,
}: ArticleRendererProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const hasAmendments = useMemo(() => {
    AMENDMENT_RE.lastIndex = 0;
    return AMENDMENT_RE.test(content);
  }, [content]);

  const handleCopy = useCallback(() => {
    const text = `${number ? number + ' ' : ''}${title || ''}\n\n${content}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Текст скопирован');
    setTimeout(() => setCopied(false), 2000);
  }, [title, number, content]);

  const handleAI = useCallback(() => {
    onAIExplain?.(
      `${number ? number + ' ' : ''}${title || ''}`,
      content.slice(0, 2000)
    );
  }, [title, number, content, onAIExplain]);

  const displayTitle = number ? `${number} ${title || ''}` : title;

  const processedContent = useMemo(
    () => processContent(content, searchQuery, onArticleClick),
    [content, searchQuery, onArticleClick]
  );

  return (
    <article id={`section-${id}`} className="scroll-mt-24">
      {displayTitle && (
        <div className="flex items-start justify-between gap-2">
          <h2
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              fontSize: level <= 1 ? 20 : 18,
              fontWeight: 600,
              color: 'hsl(var(--navy-900))',
              marginTop: level <= 1 ? 40 : 32,
              marginBottom: level <= 1 ? 16 : 8,
              textTransform: level <= 0 ? 'uppercase' : undefined,
              letterSpacing: level <= 0 ? '0.5px' : undefined,
            }}
          >
            {displayTitle}
          </h2>
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <button
              onClick={handleCopy}
              className="btn-ghost flex items-center gap-1.5 text-xs"
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              {copied ? <Check className="h-3.5 w-3.5" style={{ color: 'hsl(var(--green-text))' }} /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            {onAIExplain && (
              <button
                onClick={handleAI}
                className="btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                <Bot className="h-3.5 w-3.5" />
                Объяснить
              </button>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 17,
          lineHeight: 1.8,
          color: 'hsl(var(--gray-900))',
        }}
      >
        {processedContent}
      </div>

      {hasAmendments && (
        <button
          className="btn-ghost flex items-center gap-1 mt-2"
          style={{ fontSize: 12 }}
          onClick={() => setShowHistory(!showHistory)}
        >
          <ScrollText className="h-3.5 w-3.5" />
          История изменений
        </button>
      )}
      {showHistory && (
        <div className="mt-2 p-3 rounded-xl text-sm" style={{ background: 'hsl(var(--gray-50))', color: 'hsl(var(--gray-600))' }}>
          <p>Хронология изменений будет доступна в ближайшем обновлении.</p>
        </div>
      )}

      {level >= 2 && <div className="mt-6" style={{ borderBottom: '1px solid hsl(var(--gray-200))' }} />}
    </article>
  );
}
