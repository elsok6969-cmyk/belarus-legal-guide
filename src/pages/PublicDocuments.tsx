import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Clock, BookOpen } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
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

export default function PublicDocuments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [search, setSearch] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');

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

  // Universal search via search_all RPC
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-all', search, typeFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_all', {
        query: search.trim(),
        filter_type: typeFilter || null,
        result_limit: 50,
      });
      if (error) throw error;
      // Deduplicate: for sections, keep unique by section_id; for documents by document_id
      const seen = new Set<string>();
      return ((data || []) as SearchAllResult[]).filter(r => {
        const key = r.result_type === 'section' ? `s-${r.section_id}` : `d-${r.document_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: search.trim().length >= 1,
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
    enabled: search.trim().length < 1 && (!typeFilter || !!docTypes),
  });

  const isSearchMode = search.trim().length >= 1;
  const isLoading = isSearchMode ? isSearching : isListLoading;

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
            placeholder="Поиск по названию, тексту и статьям... (например: 205 ук)"
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

      {isSearchMode && !isLoading && searchResults && (
        <p className="text-sm text-muted-foreground mb-4">
          Найдено: {searchResults.length} результат{searchResults.length === 1 ? '' : searchResults.length < 5 ? 'а' : 'ов'}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : isSearchMode && searchResults ? (
        searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((r, idx) => {
              const isSection = r.result_type === 'section' && r.section_id;
              const linkTo = isSection
                ? `/documents/${r.document_id}#section-${r.section_id}`
                : `/documents/${r.document_id}`;

              return (
                <Link key={`${r.result_type}-${r.section_id || r.document_id}-${idx}`} to={linkTo}>
                  <Card className="hover:shadow-md transition-shadow border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${
                          isSection
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {isSection ? (
                            <><BookOpen className="h-3 w-3 mr-1" />Статья</>
                          ) : (
                            r.doc_type_name || 'Документ'
                          )}
                        </span>
                        <div className="min-w-0">
                          {isSection ? (
                            <>
                              <h2 className="text-sm font-semibold leading-snug line-clamp-2">
                                {r.section_title || `Статья ${r.section_number}`}
                              </h2>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {r.document_short_title || r.document_title}
                              </p>
                            </>
                          ) : (
                            <h2 className="text-sm font-semibold leading-snug line-clamp-2">{r.document_title}</h2>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {r.doc_number && <span>№ {r.doc_number}</span>}
                            {r.doc_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(r.doc_date), 'dd.MM.yyyy')}
                              </span>
                            )}
                            {r.doc_status === 'active' && <span className="text-primary">Действует</span>}
                          </div>
                          {r.snippet && (
                            <p
                              className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3 [&>mark]:bg-yellow-200 [&>mark]:text-foreground [&>mark]:px-0.5 [&>mark]:rounded-sm"
                              dangerouslySetInnerHTML={{ __html: r.snippet }}
                            />
                          )}
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
