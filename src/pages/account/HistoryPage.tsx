import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { History, FileText, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ['view-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('view_history')
        .select('id, viewed_at, document_id, documents(id, title, doc_number)')
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('view_history').delete().eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['view-history'] });
      toast.success('История очищена');
    },
  });

  return (
    <div className="space-y-6">
      <PageSEO title="История просмотров" description="Просмотренные документы" path="/app/account/history" noindex />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> История просмотров
        </h1>
        {history && history.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => clearHistory.mutate()} className="gap-1.5">
            <Trash2 className="h-4 w-4" /> Очистить
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : history && history.length > 0 ? (
        <div className="space-y-2">
          {history.map((h) => {
            const doc = h.documents as any;
            return (
              <Card key={h.id}>
                <CardContent className="p-3">
                  <Link to={`/app/documents/${doc?.id}`} className="flex items-center gap-3 hover:underline">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{doc?.title || 'Документ'}</p>
                      {doc?.doc_number && <p className="text-xs text-muted-foreground">№ {doc.doc_number}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {h.viewed_at ? new Date(h.viewed_at).toLocaleDateString('ru-RU') : ''}
                    </span>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Вы ещё не просматривали документы</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
