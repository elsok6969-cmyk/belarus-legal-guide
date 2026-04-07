import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Clock } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function PublicDocuments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [search, setSearch] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState('');

  // Sync input → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (typeFilter) params.set('type', typeFilter);
    setSearchParams(params, { replace: true });
  }, [search, typeFilter, setSearchParams]);

  const { data: docTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await supabase.from('document_types').select('id, slug, name_ru').order('sort_order');
      return data || [];
    },
  });

  // Fulltext search via RPC when query present
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['fulltext-search', search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_documents', {
        search_query: search.trim(),
        filter_type: typeFilter || undefined,
        result_limit: 50,
      });
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        title: string;
        short_title: string | null;
        doc_number: string | null;
        doc_date: string | null;
        status: string;
        document_type_name: string;
        document_type_slug: string;
        issuing_body_name: string | null;
        snippet: string | null;
        rank: number;
        total_count: number;
      }>;
    },
    enabled: search.trim().length >= 2,
  });

  // Regular listing when no search
  const { data: docs, isLoading: isListLoading } = useQuery({
    queryKey: ['public-documents', typeFilter],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('id, title, doc_number, doc_date, status, document_types(slug, name_ru)')
        .order('doc_date', { ascending: false, nullsFirst: false });

      if (typeFilter) {
        const dt = docTypes?.find(t => t.slug === typeFilter);
        if (dt) q = q.eq('document_type_id', dt.id);
      }

      const { data } = await q.limit(50);
      return data || [];
    },
    enabled: search.trim().length < 2 && (!typeFilter || !!docTypes),
  });

  const isSearchMode = search.trim().length >= 2;
  const isLoading = isSearchMode ? isSearching : isListLoading;
  const totalCount = isSearchMode && searchResults ? (searchResults[0]?.total_count ?? 0) : null;

  const allTypes = [{ value: '', label: 'Все' }, ...(docTypes?.map(t => ({ value: t.slug, label: t.name_ru })) || [])];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO
        title="Документы — база НПА Беларуси"
        description="База нормативных правовых актов Республики Беларусь: кодексы, законы, указы, постановления. Полные тексты бесплатно."
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию и тексту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTypes.map(t => (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(t.value)}
              className="text-xs"
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {isSearchMode && !isLoading && totalCount !== null && (
        <p className="text-sm text-muted-foreground mb-4">
          Найдено: {totalCount} документ{totalCount === 1 ? '' : totalCount < 5 ? 'а' : 'ов'}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : isSearchMode && searchResults ? (
        searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`}>
                <Card className="hover:shadow-md transition-shadow border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-0.5">
                        {doc.document_type_name || ''}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-snug line-clamp-2">{doc.title}</h2>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {doc.doc_number && <span>№ {doc.doc_number}</span>}
                          {doc.doc_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.doc_date), 'dd.MM.yyyy')}
                            </span>
                          )}
                          {doc.status === 'active' && <span className="text-primary">Действует</span>}
                        </div>
                        {doc.snippet && (
                          <p
                            className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3 [&>mark]:bg-yellow-200 [&>mark]:text-foreground [&>mark]:px-0.5 [&>mark]:rounded-sm"
                            dangerouslySetInnerHTML={{ __html: doc.snippet }}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Документы не найдены</p>
        )
      ) : docs && docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map(doc => {
            const dt = doc.document_types as any;
            return (
              <Link key={doc.id} to={`/documents/${doc.id}`}>
                <Card className="hover:shadow-md transition-shadow border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-0.5">
                        {dt?.name_ru || ''}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-snug line-clamp-2">{doc.title}</h2>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {doc.doc_number && <span>№ {doc.doc_number}</span>}
                          {doc.doc_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.doc_date), 'dd.MM.yyyy')}
                            </span>
                          )}
                          {doc.status === 'active' && <span className="text-primary">Действует</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
