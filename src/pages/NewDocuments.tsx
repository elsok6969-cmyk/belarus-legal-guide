import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

function fmt(d: string | null) {
  if (!d) return '—';
  return format(new Date(d), 'dd.MM.yyyy', { locale: ru });
}

export default function NewDocuments() {
  // Recently added documents (last 30 days)
  const { data: recentDocs, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, short_title, doc_date, status, created_at, source_url, document_types!inner(name_ru, slug)')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Pending documents from pravo.by monitoring
  const { data: pendingDocs, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-documents-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_documents')
        .select('*')
        .eq('status', 'pending')
        .order('discovered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Pending updates
  const { data: pendingUpdates } = useQuery({
    queryKey: ['pending-updates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_updates')
        .select('*, documents(title, short_title)')
        .eq('status', 'pending')
        .order('discovered_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const statusLabels: Record<string, { label: string; cls: string }> = {
    active: { label: 'Действует', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    not_effective_yet: { label: 'Не вступил', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    expired: { label: 'Утратил силу', cls: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Новые документы
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Недавно добавленные документы и обнаруженные обновления
        </p>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">
            Добавленные
            {recentDocs && recentDocs.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">
                {recentDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ожидают проверки
            {pendingDocs && pendingDocs.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">
                {pendingDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="updates">
            Обновления
            {pendingUpdates && pendingUpdates.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 text-[10px] bg-amber-100 text-amber-800">
                {pendingUpdates.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Recently added documents */}
        <TabsContent value="recent" className="mt-4">
          {recentLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : recentDocs && recentDocs.length > 0 ? (
            <div className="space-y-2">
              {recentDocs.map((doc: any) => {
                const st = statusLabels[doc.status] || { label: doc.status, cls: 'bg-muted text-muted-foreground' };
                return (
                  <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/app/documents/${doc.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {doc.short_title || doc.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {(doc as any).document_types?.name_ru}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmt(doc.doc_date)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            добавлен {fmt(doc.created_at)}
                          </span>
                        </div>
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${st.cls}`} variant="secondary">
                        {st.label}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                За последние 30 дней новых документов не добавлено
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending from pravo.by */}
        <TabsContent value="pending" className="mt-4">
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : pendingDocs && pendingDocs.length > 0 ? (
            <div className="space-y-2">
              {pendingDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium line-clamp-2">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Обнаружен {fmt(doc.discovered_at)}
                      </span>
                      {doc.source_url && (
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Источник
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Нет документов, ожидающих проверки
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending updates */}
        <TabsContent value="updates" className="mt-4">
          {pendingUpdates && pendingUpdates.length > 0 ? (
            <div className="space-y-2">
              {pendingUpdates.map((upd: any) => (
                <Card key={upd.id}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium line-clamp-2">
                      {upd.documents?.short_title || upd.documents?.title || 'Документ'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>Было: {upd.old_date || '—'}</span>
                      <span>→</span>
                      <span className="text-amber-600 font-medium">Новая ред.: {upd.new_date || '—'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmt(upd.discovered_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Нет ожидающих обновлений
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
