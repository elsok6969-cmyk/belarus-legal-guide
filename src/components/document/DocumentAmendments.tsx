import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

interface Amendment {
  id: string;
  amendment_law_title: string;
  amendment_law_number: string | null;
  amendment_date: string | null;
  affected_articles: string[] | null;
}

interface DeduplicatedAmendment {
  key: string;
  displayNumber: string;
  displayTitle: string;
  date: string | null;
  affected_articles: string[];
}

interface DocumentAmendmentsProps {
  documentId: string;
  onArticleClick?: (articleNum: string) => void;
}

export function DocumentAmendments({ documentId, onArticleClick }: DocumentAmendmentsProps) {
  const [open, setOpen] = useState(false);

  const { data: amendments } = useQuery({
    queryKey: ['document-amendments', documentId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('document_amendments')
        .select('id, amendment_law_title, amendment_law_number, amendment_date, affected_articles')
        .eq('document_id', documentId)
        .order('amendment_date', { ascending: false });
      return (data || []) as Amendment[];
    },
    enabled: !!documentId,
    staleTime: 3600000,
  });

  // Deduplicate by law number — keep latest date
  const deduped: DeduplicatedAmendment[] = useMemo(() => {
    if (!amendments || amendments.length === 0) return [];
    const map = new Map<string, DeduplicatedAmendment>();

    for (const a of amendments) {
      const key = a.amendment_law_number || a.amendment_law_title;
      const existing = map.get(key);

      // Merge affected_articles
      const articles = [
        ...(existing?.affected_articles || []),
        ...(a.affected_articles || []),
      ];
      const uniqueArticles = [...new Set(articles)];

      // Keep latest date
      const bestDate = !existing?.date ? a.amendment_date
        : !a.amendment_date ? existing.date
        : (a.amendment_date > existing.date ? a.amendment_date : existing.date);

      // Extract short title
      const match = a.amendment_law_title.match(/[«"«](.+?)[»"»]/);
      const displayTitle = match ? `«${match[1]}»` : '';

      map.set(key, {
        key,
        displayNumber: a.amendment_law_number ? `Закон № ${a.amendment_law_number}` : shortTitle(a.amendment_law_title),
        displayTitle,
        date: bestDate,
        affected_articles: uniqueArticles,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }, [amendments]);

  const handleArticleClick = useCallback((art: string) => {
    const num = art.replace(/\D/g, '');
    if (num && onArticleClick) onArticleClick(num);
  }, [onArticleClick]);

  if (deduped.length === 0) return null;

  return (
    <div className="border border-border rounded-lg bg-muted/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">
          История изменений{' '}
          <span className="text-muted-foreground font-normal">· {deduped.length}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="max-h-[300px] overflow-y-auto border-t border-border/50">
          {deduped.map((a, idx) => (
            <div
              key={a.key}
              className={`px-4 py-2 ${idx < deduped.length - 1 ? 'border-b border-border/30' : ''}`}
            >
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-medium tabular-nums whitespace-nowrap">
                  {formatDate(a.date)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate">
                  {a.displayNumber}
                  {a.displayTitle && (
                    <span className="ml-1">{a.displayTitle}</span>
                  )}
                </span>
              </div>
              {a.affected_articles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.affected_articles.slice(0, 12).map((art, i) => (
                    <button
                      key={i}
                      onClick={() => handleArticleClick(art)}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      ст. {art.replace(/\D/g, '') || art}
                    </button>
                  ))}
                  {a.affected_articles.length > 12 && (
                    <span className="text-[11px] text-muted-foreground px-1">
                      +{a.affected_articles.length - 12}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
}

function shortTitle(title: string): string {
  const match = title.match(/(Закон[а-я]*\s+.*?[№N]\s*\d+[\-\/]?[А-Яа-яA-Z]*)/i);
  if (match) return match[1];
  if (title.length > 80) return title.substring(0, 77) + '...';
  return title;
}
