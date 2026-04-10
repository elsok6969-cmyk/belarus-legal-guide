import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Bot, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

/** Detect amendment notes like "(в ред. Закона от ...)", "(см. текст ...)", "(п. 2 статьи 5 в ред. ...)" */
const AMENDMENT_RE = /\((?:в\s+ред\.|см\.\s+текст|п\.\s+\d+\s+стать[ийею]\s+\d+\s+в\s+ред\.).*?\)/gi;

/** Inline amendment note regex for highlighting within a line */
const INLINE_AMENDMENT_RE = /\((?:в\s+ред\.|см\.\s+текст|п\.\s+\d+\s+стать[ийею]\s+\d+\s+в\s+ред\.).*?\)/gi;
/** Detect cross-references like "статья 45", "ст. 102" */
const ARTICLE_REF_RE = /(?:стать[яиейю]|ст\.)\s*(\d+(?:[.-]\d+)?)/gi;

function highlightSearch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : part
  );
}

/** Wrap inline amendment notes like "(в ред. ...)" in a styled span */
function wrapAmendments(node: React.ReactNode, keyPrefix: string): React.ReactNode {
  if (typeof node !== 'string') return node;
  const regex = new RegExp(INLINE_AMENDMENT_RE.source, 'gi');
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m;
  while ((m = regex.exec(node)) !== null) {
    if (m.index > last) parts.push(node.slice(last, m.index));
    parts.push(
      <span key={`${keyPrefix}-am-${m.index}`} className="text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950 px-2 py-0.5 rounded">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last === 0) return node;
  if (last < node.length) parts.push(node.slice(last));
  return <>{parts}</>;
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

    // Check if this is an amendment note
    const isAmendment = AMENDMENT_RE.test(line);
    AMENDMENT_RE.lastIndex = 0;

    if (isAmendment) {
      result.push(
        <div key={i} className="text-sm text-muted-foreground italic border-l-[3px] border-muted-foreground/30 pl-3 my-2">
          {highlightSearch(line, searchQuery || '')}
        </div>
      );
      continue;
    }

    // Process cross-references
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
          className="text-primary underline decoration-dotted underline-offset-2 cursor-pointer hover:text-primary/80 transition-colors"
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
      <p key={i} className="mb-1.5 leading-[1.8]">
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

  const headingClass = cn(
    'font-serif',
    level <= 0 && 'text-xl font-bold tracking-tight mt-10 mb-4 first:mt-0 uppercase text-foreground',
    level === 1 && 'text-lg font-bold mt-8 mb-3 uppercase text-foreground',
    level === 2 && 'text-lg font-bold mt-8 mb-2 text-foreground',
    level >= 3 && 'text-[18px] font-bold mt-8 mb-2 text-foreground',
  );

  const processedContent = useMemo(
    () => processContent(content, searchQuery, onArticleClick),
    [content, searchQuery, onArticleClick]
  );

  return (
    <article
      id={`section-${id}`}
      className="scroll-mt-24"
    >
      {displayTitle && (
        <div className="flex items-start justify-between gap-2">
          <h2 className={headingClass}>{displayTitle}</h2>
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5 border-border/60 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
            {onAIExplain && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 border-border/60 text-muted-foreground hover:text-foreground"
                onClick={handleAI}
              >
                <Bot className="h-3.5 w-3.5" />
                Объяснить
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="font-serif text-base leading-[1.8] text-foreground">
        {!content || content.trim().length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Текст статьи временно недоступен.</p>
            <p className="text-sm mt-1">Попробуйте обновить страницу позже.</p>
          </div>
        ) : (
          processedContent
        )}
      </div>

      {/* Amendment history button */}
      {hasAmendments && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-muted-foreground gap-1"
          onClick={() => setShowHistory(!showHistory)}
        >
          <ScrollText className="h-3.5 w-3.5" />
          История изменений
        </Button>
      )}
    </article>
  );
}