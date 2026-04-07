import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Search, Bot, Bookmark, DollarSign, CalendarDays,
  TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowRight, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [bookmarks, subscriptions, docs] = await Promise.all([
        supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
      ]);
      return {
        bookmarks: bookmarks.count || 0,
        subscriptions: subscriptions.count || 0,
        totalDocs: docs.count || 0,
      };
    },
    enabled: !!user,
  });

  const { data: recentDocs } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, doc_number, status')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: rates } = useQuery({
    queryKey: ['dashboard-rates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(7);
      if (!data || data.length === 0) return [];
      const latestDate = data[0].rate_date;
      return data.filter((r) => r.rate_date === latestDate);
    },
  });

  const { data: deadlines } = useQuery({
    queryKey: ['dashboard-deadlines'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deadline_calendar')
        .select('*')
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .order('deadline_date')
        .limit(4);
      return data || [];
    },
  });

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';

  const getDaysLeft = (date: string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добро пожаловать{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Платформа правовой информации Республики Беларусь
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalDocs ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Документов в базе</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.bookmarks ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Закладок</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{deadlines?.length ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Ближайших сроков</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-muted-foreground">Ассистент готов</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/app/search">
            <Search className="mr-3 h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Поиск документов</p>
              <p className="text-xs text-muted-foreground">По названию или номеру</p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/app/assistant">
            <Bot className="mr-3 h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">AI Ассистент</p>
              <p className="text-xs text-muted-foreground">Задайте вопрос</p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/app/bookmarks">
            <Bookmark className="mr-3 h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Мои закладки</p>
              <p className="text-xs text-muted-foreground">{stats?.bookmarks || 0} сохранённых</p>
            </div>
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Последние документы</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/search">Все <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentDocs ? (
              <div className="space-y-2">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/app/documents/${doc.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{doc.title}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Ближайшие сроки</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/services/calendar">Все <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {deadlines ? (
              deadlines.length > 0 ? (
                <div className="space-y-2">
                  {deadlines.map((d) => {
                    const days = getDaysLeft(d.deadline_date);
                    const urgent = days <= 7;
                    return (
                      <div
                        key={d.id}
                        className={`p-2.5 rounded-md text-sm ${
                          urgent ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-xs leading-tight">{d.title}</span>
                          <span className={`text-xs shrink-0 flex items-center gap-1 ${
                            urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'
                          }`}>
                            {urgent && <AlertTriangle className="h-3 w-3" />}
                            <Clock className="h-3 w-3" />
                            {days} дн.
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(d.deadline_date).toLocaleDateString('ru-RU')} • {d.category}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Нет предстоящих сроков</p>
              )
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {rates && rates.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Курсы валют НБРБ</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/services/rates">Подробнее <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {rates.slice(0, 4).map((r) => {
                const change = Number(r.change_value) || 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{r.currency_code}</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">{Number(r.rate).toFixed(4)}</p>
                      <p className={`text-xs flex items-center gap-0.5 ${
                        change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {change > 0 ? '+' : ''}{change.toFixed(4)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
