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

const DOC_TYPE_LABELS: Record<string, string> = {
  law: 'Закон',
  codex: 'Кодекс',
  decree: 'Декрет / Указ',
  resolution: 'Постановление',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  amended: 'Изменён',
  repealed: 'Утратил силу',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  amended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  repealed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AppSearch() {
  const [query, setQuery] = useState('');
  const [docType, setDocType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [submitted, setSubmitted] = useState('');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents-search', submitted, docType, status],
    queryFn: async () => {
      let q = supabase.from('documents').select('*').order('date_adopted', { ascending: false });

      if (submitted) {
        q = q.or(`title.ilike.%${submitted}%,doc_number.ilike.%${submitted}%,summary.ilike.%${submitted}%`);
      }
      if (docType !== 'all') q = q.eq('doc_type', docType);
      if (status !== 'all') q = q.eq('status', status as any);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
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
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Тип документа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="law">Закон</SelectItem>
              <SelectItem value="codex">Кодекс</SelectItem>
              <SelectItem value="decree">Декрет / Указ</SelectItem>
              <SelectItem value="resolution">Постановление</SelectItem>
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
              <SelectItem value="amended">Изменён</SelectItem>
              <SelectItem value="repealed">Утратил силу</SelectItem>
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
          {documents.map((doc) => (
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
                        <span>{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                        {doc.doc_number && <span>№ {doc.doc_number}</span>}
                        {doc.date_adopted && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.date_adopted).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                      {doc.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{doc.summary}</p>
                      )}
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
          ))}
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
