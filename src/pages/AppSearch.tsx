import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, FileText, Calendar, Scale, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  not_effective_yet: 'Не вступил в силу',
  expired: 'Утратил силу',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_effective_yet: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const PAGE_SIZE = 50;

export default function AppSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const logRef = useRef(false);

  // Read filters from URL
  const submitted = searchParams.get('q') || '';
  const filterType = searchParams.get('type') || '';
  const filterStatus = searchParams.get('status') || '';
  const filterDateFrom = searchParams.get('date_from') || '';
  const filterDateTo = searchParams.get('date_to') || '';
  const filterBody = searchParams.get('body') || '';
  const exactMatch = searchParams.get('exact') === '1';
  const titleOnly = searchParams.get('title_only') === '1';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local filter state for the form
  const [localType, setLocalType] = useState(filterType);
  const [localStatus, setLocalStatus] = useState(filterStatus);
  const [localDateFrom, setLocalDateFrom] = useState(filterDateFrom);
  const [localDateTo, setLocalDateTo] = useState(filterDateTo);
  const [localBody, setLocalBody] = useState(filterBody);
  const [localExact, setLocalExact] = useState(exactMatch);
  const [localTitleOnly, setLocalTitleOnly] = useState(titleOnly);

  // Sync local state when URL changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setLocalType(searchParams.get('type') || '');
    setLocalStatus(searchParams.get('status') || '');
    setLocalDateFrom(searchParams.get('date_from') || '');
    setLocalDateTo(searchParams.get('date_to') || '');
    setLocalBody(searchParams.get('body') || '');
    setLocalExact(searchParams.get('exact') === '1');
    setLocalTitleOnly(searchParams.get('title_only') === '1');
  }, [searchParams]);

  const { data: docTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await supabase.from('document_types').select('id, slug, name_ru').order('sort_order');
      return data || [];
    },
  });

  const hasSearch = submitted || filterType || filterStatus || filterDateFrom || filterDateTo || filterBody;

  const { data: results, isLoading } = useQuery({
    queryKey: ['fts-search', submitted, filterType, filterStatus, filterDateFrom, filterDateTo, filterBody, exactMatch, titleOnly, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_documents', {
        search_query: submitted || '',
        filter_type: filterType || null,
        filter_status: filterStatus || null,
        filter_date_from: filterDateFrom || null,
        filter_date_to: filterDateTo || null,
        filter_body: filterBody || null,
        exact_match: exactMatch,
        title_only: titleOnly,
        result_limit: PAGE_SIZE,
        result_offset: (page - 1) * PAGE_SIZE,
      });
      if (error) throw error;
      return data as Array<{
        id: string; title: string; short_title: string | null;
        doc_number: string | null; doc_date: string | null; status: string;
        document_type_name: string; document_type_slug: string;
        issuing_body_name: string | null; snippet: string | null;
        rank: number; total_count: number;
      }>;
    },
    enabled: !!hasSearch,
  });

  const totalCount = results?.[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateParams = (overrides: Record<string, string>) => {
    const params: Record<string, string> = {};
    const q = overrides.q ?? query;
    if (q) params.q = q;
    const type = overrides.type ?? localType;
    if (type) params.type = type;
    const status = overrides.status ?? localStatus;
    if (status) params.status = status;
    const df = overrides.date_from ?? localDateFrom;
    if (df) params.date_from = df;
    const dt = overrides.date_to ?? localDateTo;
    if (dt) params.date_to = dt;
    const body = overrides.body ?? localBody;
    if (body) params.body = body;
    const exact = overrides.exact ?? (localExact ? '1' : '');
    if (exact) params.exact = exact;
    const to = overrides.title_only ?? (localTitleOnly ? '1' : '');
    if (to) params.title_only = to;
    if (overrides.page && overrides.page !== '1') params.page = overrides.page;
    setSearchParams(params, { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: query, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setLocalType('');
    setLocalStatus('');
    setLocalDateFrom('');
    setLocalDateTo('');
    setLocalBody('');
    setLocalExact(false);
    setLocalTitleOnly(false);
    setSearchParams(query ? { q: query } : {}, { replace: true });
  };

  const hasActiveFilters = localType || localStatus || localDateFrom || localDateTo || localBody || localExact || localTitleOnly;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Поиск по законодательству</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Найдите нужный нормативный правовой акт по названию, номеру или содержанию
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по базе документов..."
              className="pl-9 h-11 text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Искать
          </Button>
        </div>

        {/* Advanced filters toggle */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
                <Filter className="h-4 w-4" />
                Расширенный поиск
                {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-destructive hover:text-destructive gap-1">
                <X className="h-3 w-3" />
                Сбросить фильтры
              </Button>
            )}
          </div>

          <CollapsibleContent className="mt-3">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Checkboxes */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="exact"
                      checked={localExact}
                      onCheckedChange={(c) => setLocalExact(!!c)}
                    />
                    <Label htmlFor="exact" className="text-sm">Точное совпадение</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="title_only"
                      checked={localTitleOnly}
                      onCheckedChange={(c) => setLocalTitleOnly(!!c)}
                    />
                    <Label htmlFor="title_only" className="text-sm">Искать только в названии</Label>
                  </div>
                </div>

                {/* Selects and inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Тип документа</Label>
                    <Select value={localType || '__all__'} onValueChange={(v) => setLocalType(v === '__all__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все типы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все типы</SelectItem>
                        {docTypes?.map(dt => (
                          <SelectItem key={dt.slug} value={dt.slug}>{dt.name_ru}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Статус</Label>
                    <Select value={localStatus || '__all__'} onValueChange={(v) => setLocalStatus(v === '__all__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все статусы</SelectItem>
                        <SelectItem value="active">Действующий</SelectItem>
                        <SelectItem value="not_effective_yet">Не вступил в силу</SelectItem>
                        <SelectItem value="expired">Утратил силу</SelectItem>
                        <SelectItem value="cancelled">Отменён</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Орган принятия</Label>
                    <Input
                      placeholder="Название органа..."
                      value={localBody}
                      onChange={(e) => setLocalBody(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Дата от</Label>
                    <Input
                      type="date"
                      value={localDateFrom}
                      onChange={(e) => setLocalDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Дата до</Label>
                    <Input
                      type="date"
                      value={localDateTo}
                      onChange={(e) => setLocalDateTo(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => updateParams({ page: '1' })}
                >
                  Применить фильтры
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasSearch && results && results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Найдено документов: <span className="font-medium text-foreground">{totalCount}</span>
            {totalPages > 1 && (
              <span className="ml-2">
                (страница {page} из {totalPages})
              </span>
            )}
          </p>

          <div className="space-y-2">
            {results.map((doc) => (
              <Link key={doc.id} to={`/app/documents/${doc.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type_name}
                        </Badge>
                        <Badge variant="secondary" className={STATUS_COLORS[doc.status] || ''}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium text-sm leading-tight">{doc.title}</span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {doc.doc_number && <span>№ {doc.doc_number}</span>}
                        {doc.doc_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        {doc.issuing_body_name && (
                          <span>{doc.issuing_body_name}</span>
                        )}
                      </div>

                      {/* Snippet */}
                      {doc.snippet && (
                        <p
                          className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3 [&_mark]:bg-yellow-200 [&_mark]:text-yellow-900 dark:[&_mark]:bg-yellow-800/40 dark:[&_mark]:text-yellow-200"
                          dangerouslySetInnerHTML={{ __html: doc.snippet }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Назад
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </div>
      ) : hasSearch ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              По вашему запросу ничего не найдено. Попробуйте изменить запрос или фильтры.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Введите запрос для поиска по базе законодательства Республики Беларусь.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
