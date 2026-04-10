import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, FileText, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, typeof Bell> = {
  document_changed: FileText,
  new_document: FileText,
  deadline_reminder: AlertCircle,
  system: Info,
};

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const date = new Date(item.created_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    (groups[date] ??= []).push(item);
  }
  return groups;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('Все уведомления отмечены как прочитанные');
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const grouped = useMemo(() => groupByDate(notifications || []), [notifications]);
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <PageSEO title="Уведомления" description="Ваши уведомления" path="/app/account/notifications" noindex />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Уведомления
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Прочитать все
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{date}</h2>
            {items.map((n: any) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <Card
                  key={n.id}
                  className={cn('cursor-pointer transition-colors', !n.is_read && 'border-primary/30 bg-primary/5')}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id);
                    if (n.document_id) window.location.href = `/app/documents/${n.document_id}`;
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="relative mt-0.5">
                      {!n.is_read && (
                        <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                      )}
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.is_read && 'font-medium')}>{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">У вас пока нет уведомлений</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
