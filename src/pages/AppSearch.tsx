import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Calendar, Scale, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  not_effective_yet: 'Не вступил в силу',
  expired: 'Истёк',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_effective_yet: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function AppSearch() {
  const [query, setQuery] = useState('');
  const [docTypeSlug, setDocTypeSlug] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [submitted, setSubmitted] = useState('');

  const { data: docTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await supabase.from('document_types').select('id, slug, name_ru').order('sort_order');
      return data || [];
    },
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents-search', submitted, docTypeSlug, status],
    queryFn: async () => {
      let q = supabase.from('documents')
        .select('*, document_types(slug, name_ru)')
        .order('doc_date', { ascending: false, nullsFirst: false });

      if (submitted) {
        q = q.or(`title.ilike.%${submitted}%,doc_number.ilike.%${submitted}%`);
      }
      if (docTypeSlug !== 'all') {
        const dt = docTypes?.find(t => t.slug === docTypeSlug);
        if (dt) q = q.eq('document_type_id', dt.id);
      }
      if (status !== 'all') q = q.eq('status', status);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: docTypeSlug === 'all' || !!docTypes,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Поиск по законодательству</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Найдите нужный нормативный правовой акт по названию, номеру или содержанию
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Название, номер документа или ключевое слово..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Найти
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={docTypeSlug} onValueChange={setDocTypeSlug}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Тип документа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {docTypes?.map(dt => (
                <SelectItem key={dt.slug} value={dt.slug}>{dt.name_ru}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <Scale className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Действующий</SelectItem>
              <SelectItem value="not_effective_yet">Не вступил в силу</SelectItem>
              <SelectItem value="expired">Истёк</SelectItem>
              <SelectItem value="cancelled">Отменён</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Найдено документов: <span className="font-medium text-foreground">{documents.length}</span>
          </p>
          {documents.map((doc) => {
            const dt = doc.document_types as any;
            return (
              <Link key={doc.id} to={`/app/documents/${doc.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-sm leading-tight">{doc.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {dt && <span>{dt.name_ru}</span>}
                          {doc.doc_number && <span>№ {doc.doc_number}</span>}
                          {doc.doc_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className={STATUS_COLORS[doc.status] || ''}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {submitted
                ? 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.'
                : 'Введите запрос для поиска по базе законодательства Республики Беларусь.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
