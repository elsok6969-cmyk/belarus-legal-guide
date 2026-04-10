import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, FileText, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  expired: 'Истёк',
  cancelled: 'Отменён',
  not_effective_yet: 'Не вступил в силу',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  not_effective_yet: 'bg-amber-100 text-amber-800',
};

export default function Bookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, created_at, document_id, documents(id, title, doc_number, status, doc_date)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const removeBookmark = useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({ title: 'Закладка удалена' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Закладки</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Сохранено документов: <span className="font-medium text-foreground">{bookmarks.length}</span>
          </p>
          {bookmarks.map((bm) => {
            const doc = bm.documents as any;
            if (!doc) return null;
            return (
              <Card key={bm.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Link to={`/app/documents/${doc.id}`} className="flex-1 min-w-0 space-y-1 hover:underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">{doc.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.doc_number && <span>№ {doc.doc_number}</span>}
                        {doc.doc_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        <Badge className={STATUS_COLORS[doc.status] || ''} variant="secondary">
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => removeBookmark.mutate(bm.id)}
                        disabled={removeBookmark.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link to={`/app/documents/${doc.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              У вас пока нет сохранённых документов.
            </p>
            <Button asChild variant="link" className="mt-2">
              <Link to="/app/search">Перейти к поиску →</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
