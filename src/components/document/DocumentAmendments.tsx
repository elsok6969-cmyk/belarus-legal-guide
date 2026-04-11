import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, History } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useCallback } from 'react';

interface Amendment {
  id: string;
  amendment_law_title: string;
  amendment_law_number: string | null;
  amendment_date: string | null;
  affected_articles: string[] | null;
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

  const handleArticleClick = useCallback((art: string) => {
    // Extract number from "ст. 123"
    const num = art.replace(/\D/g, '');
    if (num && onArticleClick) onArticleClick(num);
  }, [onArticleClick]);

  if (!amendments || amendments.length === 0) return null;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  // Truncate title to something reasonable
  const shortTitle = (title: string) => {
    // Try to extract just the law name: "Закон ... № XXX-З"
    const match = title.match(/(Закон[а-я]*\s+.*?[№N]\s*\d+[\-\/]?[А-Яа-яA-Z]*)/i);
    if (match) return match[1];
    if (title.length > 100) return title.substring(0, 97) + '...';
    return title;
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4 text-muted-foreground" />
            <span>История изменений</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {amendments.length}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[100px_1fr_auto] gap-2 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
            <span>Дата</span>
            <span>Закон</span>
            <span className="hidden sm:block">Затронутые статьи</span>
          </div>

          {/* Rows */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {amendments.map((a) => (
              <div key={a.id} className="grid grid-cols-[100px_1fr_auto] gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors items-start">
                <span className="text-sm font-medium tabular-nums">
                  {formatDate(a.amendment_date)}
                </span>
                <span className="text-sm">
                  {a.amendment_law_number
                    ? `Закон № ${a.amendment_law_number}`
                    : shortTitle(a.amendment_law_title)
                  }
                </span>
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                  {a.affected_articles && a.affected_articles.length > 0 ? (
                    a.affected_articles.slice(0, 8).map((art, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); handleArticleClick(art); }}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        {art}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {a.affected_articles && a.affected_articles.length > 8 && (
                    <span className="text-xs text-muted-foreground">+{a.affected_articles.length - 8}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
