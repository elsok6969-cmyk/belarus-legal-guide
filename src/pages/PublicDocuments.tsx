import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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

type ChipFilter = '' | 'kodeks' | 'zakon' | 'ukaz' | 'postanovlenie' | 'sections';

const CHIPS: { value: ChipFilter; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'kodeks', label: 'Кодексы' },
  { value: 'zakon', label: 'Законы' },
  { value: 'ukaz', label: 'Указы' },
  { value: 'postanovlenie', label: 'Постановления' },
  { value: 'sections', label: 'Статьи' },
];

export default function PublicDocuments() {
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

  const rpcFilterType = chipFilter && chipFilter !== 'sections' ? chipFilter : null;

  const { data: searchResults, isLoading: isSearching, isError: isSearchError } = useQuery({
    queryKey: ['search-all', search, rpcFilterType],
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const { data, error } = await supabase.rpc('search_all', {
          query: search.trim(),
          filter_type: rpcFilterType,
          result_limit: 50,
        }, { signal: controller.signal } as any);
        clearTimeout(timeout);
        if (error) throw error;
        const seen = new Set<string>();
        return ((data || []) as SearchAllResult[]).filter(r => {
          const key = r.result_type === 'section' ? `s-${r.section_id}` : `d-${r.document_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } catch (e: any) {
        clearTimeout(timeout);
        if (e?.name === 'AbortError') throw new Error('timeout');
        throw e;
      }
    },
    enabled: search.trim().length >= 1,
    retry: false,
  });

  const { data: docs, isLoading: isListLoading, isError: isListError } = useQuery({
    queryKey: ['public-documents-list'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, doc_number, doc_date, status, document_types(slug, name_ru)')
          .order('doc_date', { ascending: false, nullsFirst: false })
          .limit(50)
          .abortSignal(controller.signal);
        clearTimeout(timeout);
        if (error) throw error;
        return data || [];
      } catch (e: any) {
        clearTimeout(timeout);
        if (e?.name === 'AbortError') throw new Error('timeout');
        throw e;
      }
    },
    enabled: search.trim().length < 1,
    retry: false,
  });

  const isSearchMode = search.trim().length >= 1;
  const isLoading = isSearchMode ? isSearching : isListLoading;

  // Filter by chip
  let filteredResults = searchResults || [];
  if (chipFilter === 'sections') {
    filteredResults = filteredResults.filter(r => r.result_type === 'section');
  }

  const docResults = filteredResults.filter(r => r.result_type === 'document');
  const sectionResults = filteredResults.filter(r => r.result_type === 'section');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO
        title="Документы — база НПА Беларуси"
        description="База нормативных правовых актов Республики Беларусь: кодексы, законы, указы, постановления. Полные тексты с навигацией по статьям."
        path="/documents"
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Документы' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Документы
      </h1>

      {/* Search bar */}
      <div className="mb-3 w-full max-w-full md:max-w-[560px]">
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

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto scrollbar-none pb-1">
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

      {/* Counter */}
      {isSearchMode && !isLoading && filteredResults.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Найдено: {filteredResults.length} результат{filteredResults.length === 1 ? '' : filteredResults.length < 5 ? 'а' : 'ов'}
          {docResults.length > 0 && sectionResults.length > 0 && (
            <span> ({docResults.length} документ{docResults.length === 1 ? '' : docResults.length < 5 ? 'а' : 'ов'}, {sectionResults.length} стат{sectionResults.length === 1 ? 'ья' : sectionResults.length < 5 ? 'ьи' : 'ей'})</span>
          )}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-0 divide-y divide-border">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
        </div>
      ) : isSearchMode && isSearchError ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">Не удалось загрузить результаты поиска</p>
          <p className="text-sm text-muted-foreground mt-1">Попробуйте обновить страницу или повторить запрос позже</p>
        </div>
      ) : !isSearchMode && isListError ? (
        <div className="text-center py-12">
          <p className="text-foreground font-medium">Не удалось загрузить документы</p>
          <p className="text-sm text-muted-foreground mt-1">Попробуйте обновить страницу или повторить запрос позже</p>
        </div>
      ) : isSearchMode ? (
        filteredResults.length > 0 ? (
          <div>
            {docResults.length > 0 && (
              <>
                {sectionResults.length > 0 && (
                  <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2">📚 Документы</p>
                )}
                <div className="divide-y divide-border border-t border-b border-border">
                  {docResults.map((r, idx) => (
                    <DocumentResultRow key={`d-${r.document_id}-${idx}`} result={r} />
                  ))}
                </div>
              </>
            )}
            {sectionResults.length > 0 && (
              <>
                <p className={`text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 ${docResults.length > 0 ? 'mt-6' : ''}`}>
                  📄 Статьи
                </p>
                <div className="divide-y divide-border border-t border-b border-border">
                  {sectionResults.map((r, idx) => (
                    <DocumentResultRow key={`s-${r.section_id}-${idx}`} result={r} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground font-medium">По запросу «{search.trim()}» ничего не найдено</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте другие ключевые слова или проверьте написание</p>
          </div>
        )
      ) : docs && docs.length > 0 ? (
        <div className="divide-y divide-border border-t border-b border-border">
          {docs.map(doc => {
            const dt = doc.document_types as any;
            return (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="block px-3 py-3 hover:bg-muted/50 transition-colors duration-150">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{dt?.name_ru || ''}</span>
                  {doc.status === 'active' && <span className="text-xs text-emerald-600">Действует</span>}
                </div>
                <h2 className="text-[15px] font-semibold leading-snug line-clamp-2 text-foreground">{doc.title}</h2>
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

function DocumentResultRow({ result: r }: { result: SearchAllResult }) {
  return (
    <Link to={`/documents/${r.document_id}`} className="block px-3 py-3 hover:bg-muted/50 transition-colors duration-150">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-primary">{r.doc_type_name || 'Документ'}</span>
        {r.doc_status === 'active' && <span className="text-xs text-emerald-600">Действует</span>}
      </div>
      <h2 className="text-[16px] font-semibold leading-snug line-clamp-2 text-foreground">{r.document_title}</h2>
      <div className="flex items-center gap-2 mt-1 text-[13px] text-muted-foreground">
        {r.doc_number && <span>№ {r.doc_number}</span>}
        {r.doc_number && r.doc_date && <span>·</span>}
        {r.doc_date && <span>{format(new Date(r.doc_date), 'dd.MM.yyyy')}</span>}
      </div>
      {r.snippet && (
        <p
          className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2"
          dangerouslySetInnerHTML={{ __html: r.snippet }}
        />
      )}
    </Link>
  );
}