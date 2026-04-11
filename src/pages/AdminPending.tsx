import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPending() {
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin-pending-docs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_documents')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const pendingOnly = pending?.filter(d => d.status === 'pending') || [];
  const processed = pending?.filter(d => d.status !== 'pending') || [];

  const skipMutation = useMutation({
    mutationFn: async (id: string) => {
      setActionId(id);
      const { error } = await supabase
        .from('pending_documents')
        .update({ status: 'skipped' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-docs'] });
      toast.success('Пропущен');
      setActionId(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setActionId(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (doc: any) => {
      setActionId(doc.id);
      if (!doc.source_url) throw new Error('Нет URL для импорта');

      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scrape-and-fill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ url: doc.source_url, pending_id: doc.id }),
        }
      );

      const result = await resp.json();
      if (!resp.ok || result.error) throw new Error(result.error || 'Import failed');

      await supabase
        .from('pending_documents')
        .update({ status: 'imported' })
        .eq('id', doc.id);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-docs'] });
      toast.success('Импортирован');
      setActionId(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setActionId(null);
    },
  });

  const checkNow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      toast.info('Проверка pravo.by...');

      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/cron-check-new-docs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: '{}',
        }
      );
      const result = await resp.json();
      toast.success(`Найдено: ${result.found}, новых: ${result.new_docs}`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-docs'] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мониторинг pravo.by</h1>
        <Button variant="outline" onClick={checkNow}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Проверить сейчас
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Ожидают решения
            {pendingOnly.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingOnly.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pendingOnly.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет новых документов</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOnly.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(doc.discovered_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{doc.title}</span>
                        {doc.source_url && (
                          <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{doc.doc_type || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={actionId === doc.id}
                          onClick={() => importMutation.mutate(doc)}
                        >
                          {actionId === doc.id && importMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><Check className="mr-1 h-3 w-3" /> Импорт</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionId === doc.id}
                          onClick={() => skipMutation.mutate(doc.id)}
                        >
                          <X className="mr-1 h-3 w-3" /> Пропустить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {processed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Обработанные ({processed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.slice(0, 20).map(doc => (
                  <TableRow key={doc.id} className="opacity-60">
                    <TableCell className="text-xs">{new Date(doc.discovered_at).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell className="text-sm">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'imported' ? 'default' : 'secondary'}>
                        {doc.status === 'imported' ? 'Импортирован' : 'Пропущен'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
