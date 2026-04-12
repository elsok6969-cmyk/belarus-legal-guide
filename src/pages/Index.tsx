import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Star, Eye, Bell as BellIcon, ArrowRight, CalendarDays, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Index() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['dashboard-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, subscription_plan, subscription_expires_at')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Metrics
  const { data: viewedCount } = useQuery({
    queryKey: ['metric-viewed', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_document_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: favCount } = useQuery({
    queryKey: ['metric-fav', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: watchCount } = useQuery({
    queryKey: ['metric-watch', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('on_watch', true);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: aiUsage } = useQuery({
    queryKey: ['metric-ai', user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('check_limit', {
        p_user_id: user!.id,
        p_feature: 'ai_chat',
      });
      return data as unknown as { used: number; limit: number | null } | null;
    },
    enabled: !!user,
  });

  // Recent history
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['dash-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_document_history')
        .select('id, document_id, viewed_at, documents(id, title, short_title)')
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Favorites
  const { data: favorites, isLoading: loadingFav } = useQuery({
    queryKey: ['dash-favorites', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_favorites')
        .select('id, document_id, note, documents(id, title, short_title)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Upcoming deadlines
  const { data: deadlines, isLoading: loadingDeadlines } = useQuery({
    queryKey: ['dash-deadlines'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('deadline_calendar')
        .select('id, title, deadline_date, category')
        .gte('deadline_date', today)
        .order('deadline_date', { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Пользователь';
  const planLabel = profile?.subscription_plan === 'free' ? 'Пробный (бесплатный)' :
    profile?.subscription_plan === 'basic' ? 'Персональный' :
    profile?.subscription_plan === 'professional' ? 'Профессиональный' :
    profile?.subscription_plan === 'enterprise' ? 'Корпоративный' : 'Пробный (бесплатный)';
  const isFree = !profile?.subscription_plan || profile.subscription_plan === 'free';

  const formatDate = (d: string | null) => {
    if (!d) return '';
    try { return format(new Date(d), 'd MMM yyyy', { locale: ru }); } catch { return d; }
  };

  const metrics = [
    { label: 'Просмотрено документов', value: viewedCount ?? 0, icon: Eye, color: 'text-blue-500' },
    { label: 'В избранном', value: favCount ?? 0, icon: Star, color: 'text-amber-500' },
    { label: 'На контроле', value: watchCount ?? 0, icon: BellIcon, color: 'text-emerald-500' },
    {
      label: 'Вопросов помощнику',
      value: aiUsage ? `${aiUsage.used} / ${aiUsage.limit ?? '∞'}` : '0',
      icon: MessageSquare,
      color: 'text-violet-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Добро пожаловать, {displayName}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-muted-foreground">Ваш план: {planLabel}</p>
          {isFree && (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
              <Link to="/app/account/subscription">Улучшить</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics 2x2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`mt-0.5 ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: history + favorites */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent history */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Последние просмотренные</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/app/account/history">Все <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : history && history.length > 0 ? (
              <div className="space-y-1">
                {history.map((h: any) => (
                  <Link
                    key={h.id}
                    to={`/app/documents/${h.document_id}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {h.documents?.short_title || h.documents?.title || 'Документ'}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(h.viewed_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Нет истории просмотров</p>
            )}
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Избранное</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/app/account/favorites">Все <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingFav ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : favorites && favorites.length > 0 ? (
              <div className="space-y-1">
                {favorites.map((f: any) => (
                  <Link
                    key={f.id}
                    to={`/app/documents/${f.document_id}`}
                    className="block p-2.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="text-sm font-medium truncate">
                      {f.documents?.short_title || f.documents?.title || 'Документ'}
                    </p>
                    {f.note && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{f.note}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Нет избранных документов</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deadlines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Ближайшие дедлайны
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/app/calendar">Календарь <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingDeadlines ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : deadlines && deadlines.length > 0 ? (
            <div className="space-y-1">
              {deadlines.map((d) => (
                <Link
                  key={d.id}
                  to="/app/calendar"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-destructive leading-none">
                      {new Date(d.deadline_date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[10px] text-destructive/70">
                      {format(new Date(d.deadline_date + 'T00:00:00'), 'MMM', { locale: ru })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Нет предстоящих дедлайнов</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
