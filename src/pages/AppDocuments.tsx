import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface SearchAllResult {
  result_type: string;
  document_id: string;
  section_id: string | null;
  document_title: string;
  document_short_title: string | null;
  section_title: string | null;
  section_number: string | null;
  doc_type_slug: string | null;
  doc_type_name: string | null;
  doc_date: string | null;
  doc_number: string | null;
  doc_status: string | null;
  snippet: string | null;
  rank: number;
}

type ChipFilter = '' | 'codex' | 'law' | 'decree' | 'resolution' | 'sections';

const CHIPS: { value: ChipFilter; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'codex', label: 'Кодексы' },
  { value: 'law', label: 'Законы' },
  { value: 'decree', label: 'Указы' },
  { value: 'resolution', label: 'Постановления' },
  { value: 'sections', label: 'Статьи' },
];

export default function AppDocuments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as ChipFilter) || '';
  const [search, setSearch] = useState(initialQuery);
  const [chipFilter, setChipFilter] = useState<ChipFilter>(initialType);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (chipFilter) params.set('type', chipFilter);
    setSearchParams(params, { replace: true });
  }, [search, chipFilter, setSearchParams]);

  const rpcFilterType = chipFilter && chipFilter !== 'sections' ? chipFilter : undefined;

  const { data: searchResults, isLoading: isSearching, isError: isSearchError } = useQuery({
    queryKey: ['app-search-all', search, rpcFilterType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_all', {
        query: search.trim(),
        filter_type: rpcFilterType,
        result_limit: 50,
      });
      if (error) throw error;
      const seen = new Set<string>();
      return ((data || []) as SearchAllResult[]).filter(r => {
        const key = r.result_type === 'section' ? `s-${r.section_id}` : `d-${r.document_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: search.trim().length >= 1,
    retry: false,
  });

  const { data: docs, isLoading: isListLoading, isError: isListError } = useQuery({
    queryKey: ['app-documents-list', chipFilter],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('id, title, slug, doc_number, doc_date, status, document_types(slug, name_ru)')
        .order('doc_date', { ascending: false, nullsFirst: false })
        .limit(50);
      if (chipFilter && chipFilter !== 'sections') {
        q = q.eq('document_types.slug', chipFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      let results = data || [];
      if (chipFilter && chipFilter !== 'sections') {
        results = results.filter(d => (d.document_types as any)?.slug === chipFilter);
      }
      return results;
    },
    enabled: search.trim().length < 1,
    retry: false,
  });

  const isSearchMode = search.trim().length >= 1;
  const isLoading = isSearchMode ? isSearching : isListLoading;
  const loadingTimedOut = useLoadingTimeout(isLoading);

  let filteredResults = searchResults || [];
  if (chipFilter === 'sections') {
    filteredResults = filteredResults.filter(r => r.result_type === 'section');
  }

  const docResults = filteredResults.filter(r => r.result_type === 'document');
  const sectionResults = filteredResults.filter(r => r.result_type === 'section');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Документы
        </h1>
      </div>

      <div className="max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по документам и статьям..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 text-base"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {CHIPS.map(c => (
          <Button
            key={c.value}
            variant={chipFilter === c.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChipFilter(c.value)}
            className="text-xs shrink-0"
          >
            {c.label}
          </Button>
        ))}
      </div>

      {isSearchMode && !isLoading && filteredResults.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Найдено: {filteredResults.length} результат{filteredResults.length === 1 ? '' : filteredResults.length < 5 ? 'а' : 'ов'}
        </p>
      )}

      {isLoading ? (
        loadingTimedOut ? (
          <div className="text-center py-12">
            <p className="text-foreground font-medium">Не удалось загрузить данные</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-sm text-primary hover:underline">Обновить страницу</button>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
          </div>
        )
      ) : isSearchMode && isSearchError ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">Ошибка поиска</p>
        </div>
      ) : !isSearchMode && isListError ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">Не удалось загрузить документы</p>
        </div>
      ) : isSearchMode ? (
        filteredResults.length > 0 ? (
          <div className="divide-y divide-border border-t border-b border-border">
            {filteredResults.map((r, idx) => (
              <Link
                key={`${r.result_type}-${r.document_id}-${r.section_id}-${idx}`}
                to={`/app/documents/${r.document_id}`}
                className="block px-3 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{r.doc_type_name || 'Документ'}</span>
                  {r.doc_status === 'active' && <span className="text-xs text-emerald-600">Действует</span>}
                </div>
                <h2 className="text-[15px] font-semibold leading-snug line-clamp-2">{r.document_title}</h2>
                {r.section_title && (
                  <p className="text-xs text-muted-foreground mt-0.5">{r.section_number} {r.section_title}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-[13px] text-muted-foreground">
                  {r.doc_number && <span>№ {r.doc_number}</span>}
                  {r.doc_number && r.doc_date && <span>·</span>}
                  {r.doc_date && <span>{format(new Date(r.doc_date), 'dd.MM.yyyy')}</span>}
                </div>
                {r.snippet && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: r.snippet }} />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">По запросу «{search.trim()}» ничего не найдено</p>
        )
      ) : docs && docs.length > 0 ? (
        <div className="divide-y divide-border border-t border-b border-border">
          {docs.map(doc => {
            const dt = doc.document_types as any;
            return (
              <Link key={doc.id} to={`/app/documents/${(doc as any).slug || doc.id}`} className="block px-3 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{dt?.name_ru || ''}</span>
                  {doc.status === 'active' && <span className="text-xs text-emerald-600">Действует</span>}
                </div>
                <h2 className="text-[15px] font-semibold leading-snug line-clamp-2">{doc.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-[13px] text-muted-foreground">
                  {doc.doc_number && <span>№ {doc.doc_number}</span>}
                  {doc.doc_number && doc.doc_date && <span>·</span>}
                  {doc.doc_date && <span>{format(new Date(doc.doc_date), 'dd.MM.yyyy')}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">Документы не найдены</p>
      )}
    </div>
  );
}
