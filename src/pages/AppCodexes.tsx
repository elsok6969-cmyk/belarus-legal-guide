import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: 'Действующий', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  not_effective_yet: { label: 'Не вступил в силу', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expired: { label: 'Утратил силу', className: 'bg-muted text-muted-foreground' },
};

export default function AppCodexes() {
  const [filter, setFilter] = useState('');

  const { data: codexes, isLoading } = useQuery({
    queryKey: ['app-codexes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, short_title, slug, doc_date, status, document_types(name_ru, slug)')
        .eq('document_types.slug', 'codex')
        .not('document_types', 'is', null)
        .order('title');
      return (data || []).filter((d: any) => d.document_types?.slug === 'codex');
    },
    staleTime: 3600000,
  });

  // Get article counts per codex
  const codexIds = useMemo(() => (codexes || []).map((c: any) => c.id), [codexes]);

  const { data: articleCounts } = useQuery({
    queryKey: ['codex-article-counts', codexIds],
    queryFn: async () => {
      if (codexIds.length === 0) return {};
      const counts: Record<string, number> = {};
      // Batch query: count articles per document
      for (const cid of codexIds) {
        const { count } = await supabase
          .from('document_sections')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', cid)
          .eq('section_type', 'article');
        counts[cid] = count || 0;
      }
      return counts;
    },
    enabled: codexIds.length > 0,
    staleTime: 3600000,
  });

  const filtered = useMemo(() => {
    if (!codexes) return [];
    if (!filter.trim()) return codexes;
    const q = filter.toLowerCase();
    return codexes.filter((c: any) =>
      c.title.toLowerCase().includes(q) || c.short_title?.toLowerCase().includes(q)
    );
  }, [codexes, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Кодексы Республики Беларусь
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {codexes ? `${codexes.length} кодексов в актуальных редакциях` : 'Загрузка...'}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Поиск по названию..." className="pl-9" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="divide-y divide-border border-t border-b">
          {filtered.map((doc: any) => {
            const st = statusLabels[doc.status] || statusLabels.active;
            const count = articleCounts?.[doc.id] ?? null;
            return (
              <Link
                key={doc.id}
                to={`/app/documents/${doc.slug || doc.id}`}
                className="flex items-center gap-4 px-3 py-3.5 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {doc.short_title && <span>{doc.short_title}</span>}
                    {count !== null && count > 0 && <span>{count} статей</span>}
                    {doc.doc_date && <span>ред. {new Date(doc.doc_date).toLocaleDateString('ru-RU')}</span>}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${st.className}`}>
                  {st.label}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">По вашему запросу ничего не найдено</p>
      )}
    </div>
  );
}
