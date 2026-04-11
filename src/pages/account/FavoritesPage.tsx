import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Star, Eye, EyeOff, Trash2, FileText, Calendar, Pencil, X } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  expired: 'Истёк',
  cancelled: 'Отменён',
  not_effective_yet: 'Не вступил в силу',
};

type FilterType = 'all' | 'watched';

export default function FavoritesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*, documents(id, title, doc_number, status, doc_date)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const removeFavorite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_favorites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success('Удалено из избранного');
    },
  });

  const toggleWatch = useMutation({
    mutationFn: async ({ id, on_watch }: { id: string; on_watch: boolean }) => {
      if (on_watch) {
        const watchedCount = favorites?.filter((f) => f.on_watch).length || 0;
        if (watchedCount >= 5) throw new Error('Максимум 5 документов на контроле');
      }
      const { error } = await supabase.from('user_favorites').update({ on_watch }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveNote = useCallback((id: string, note: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase.from('user_favorites').update({ note: note || null }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    }, 1000);
  }, [queryClient]);

  const openNoteEditor = (id: string, currentNote: string | null) => {
    setEditingNoteId(id);
    setNoteText(currentNote || '');
  };

  const closeNoteEditor = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEditingNoteId(null);
    setNoteText('');
  };

  const filtered = favorites?.filter((f) => filter === 'all' || f.on_watch) || [];
  const watchedCount = favorites?.filter((f) => f.on_watch).length || 0;

  return (
    <div className="space-y-6">
      <PageSEO title="Избранное" description="Сохранённые документы" path="/app/account/favorites" noindex />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" /> Избранное
        </h1>
        <Badge variant="outline">{watchedCount}/5 на контроле</Badge>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          Все ({favorites?.length || 0})
        </Button>
        <Button variant={filter === 'watched' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('watched')}>
          На контроле ({watchedCount})
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((fav) => {
            const doc = fav.documents as any;
            if (!doc) return null;
            return (
              <Card key={fav.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/app/documents/${doc.id}`} className="flex-1 min-w-0 space-y-1 hover:underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm line-clamp-1">{doc.title}</span>
                        {fav.on_watch && <Badge variant="secondary" className="text-[10px] shrink-0">На контроле</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.doc_number && <span>№ {doc.doc_number}</span>}
                        {doc.doc_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                        <span>Добавлено {new Date(fav.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={fav.on_watch ? 'Снять с контроля' : 'Поставить на контроль'}
                        onClick={() => toggleWatch.mutate({ id: fav.id, on_watch: !fav.on_watch })}
                      >
                        {fav.on_watch ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFavorite.mutate(fav.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'watched' ? 'Нет документов на контроле' : 'У вас пока нет избранных документов'}
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
