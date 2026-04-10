import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Updates() {
  const { user } = useAuth();

  const { data: updates, isLoading } = useQuery({
    queryKey: ['updates', user?.id],
    queryFn: async () => {
      const { data: subs, error: subErr } = await supabase
        .from('subscriptions')
        .select('document_id')
        .eq('user_id', user!.id);
      if (subErr) throw subErr;

      if (!subs || subs.length === 0) return [];

      const docIds = subs.map((s) => s.document_id);

      const { data, error } = await supabase
        .from('document_versions')
        .select('*, documents(id, title, doc_number)')
        .in('document_id', docIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentChanges } = useQuery({
    queryKey: ['recent-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*, documents(id, title, doc_number)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Обновления</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Мои подписки</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : updates && updates.length > 0 ? (
            <div className="space-y-3">
              {updates.map((u) => {
                const doc = u.documents as any;
                return (
                  <div key={u.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Link
                        to={`/app/documents/${doc?.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {doc?.title || 'Документ'}
                      </Link>
                      {u.change_description && (
                        <p className="text-xs text-muted-foreground">{u.change_description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Версия {u.version_number}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Подпишитесь на документы, чтобы получать уведомления об изменениях.
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/app/search">Найти документы →</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние изменения в базе</CardTitle>
        </CardHeader>
        <CardContent>
          {recentChanges && recentChanges.length > 0 ? (
            <div className="space-y-3">
              {recentChanges.map((u) => {
                const doc = u.documents as any;
                return (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary">
                        Версия {u.version_number}
                      </Badge>
                      <Link
                        to={`/app/documents/${doc?.id}`}
                        className="text-sm truncate hover:underline"
                      >
                        {doc?.title || 'Документ'}
                      </Link>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Пока нет зафиксированных изменений
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
