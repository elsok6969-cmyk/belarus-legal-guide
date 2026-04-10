import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/shared/PageSEO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, MousePointer, UserPlus, CreditCard, Mail } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6'];

export default function AdminAnalytics() {
  const { data: funnel } = useQuery({
    queryKey: ['admin-funnel'],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: views }, { data: events }, { count: subscribers }] = await Promise.all([
        supabase.from('content_views').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('paywall_events').select('event_type').gte('created_at', weekAgo),
        supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).gte('subscribed_at', weekAgo),
      ]);

      const impressions = events?.filter(e => e.event_type === 'impression').length || 0;
      const clickReg = events?.filter(e => e.event_type === 'click_register').length || 0;
      const clickSub = events?.filter(e => e.event_type === 'click_subscribe').length || 0;

      return [
        { name: 'Просмотры', value: views || 0, icon: Eye },
        { name: 'Paywall показы', value: impressions, icon: Eye },
        { name: 'Клик: Регистрация', value: clickReg, icon: UserPlus },
        { name: 'Клик: Подписка', value: clickSub, icon: CreditCard },
        { name: 'Email подписки', value: subscribers || 0, icon: Mail },
      ];
    },
    staleTime: 60000,
  });

  const { data: topPages } = useQuery({
    queryKey: ['admin-top-pages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('content_views')
        .select('page_url')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(r => { counts[r.page_url] = (counts[r.page_url] || 0) + 1; });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));
    },
    staleTime: 60000,
  });

  const { data: emailBySource } = useQuery({
    queryKey: ['admin-emails-by-source'],
    queryFn: async () => {
      const { data } = await supabase.from('email_subscribers').select('source').limit(1000);
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(r => { counts[r.source] = (counts[r.source] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    staleTime: 60000,
  });

  return (
    <div className="space-y-6">
      <PageSEO title="Аналитика — Админ" description="" path="/admin/analytics" />
      <h1 className="text-2xl md:text-3xl font-bold">Аналитика и конверсии</h1>
      <p className="text-sm text-muted-foreground">Данные за последние 7 дней</p>

      {/* Funnel cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {funnel?.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={item.name} className="rounded-xl">
              <CardContent className="p-4 text-center">
                <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top pages */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Топ страниц</CardTitle></CardHeader>
          <CardContent>
            {topPages && topPages.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPages} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="url" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Email sources */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Источники email</CardTitle></CardHeader>
          <CardContent>
            {emailBySource && emailBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={emailBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {emailBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
