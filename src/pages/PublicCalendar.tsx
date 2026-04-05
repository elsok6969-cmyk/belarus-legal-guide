import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function PublicCalendar() {
  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['public-calendar-full'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('deadline_calendar')
        .select('*')
        .gte('deadline_date', today)
        .order('deadline_date')
        .limit(30);
      return data || [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO title="Календарь сроков — Право БY" description="Календарь дедлайнов по налогам и отчётности для бухгалтеров и юристов Беларуси." path="/calendar" />
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        Календарь сроков
      </h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : deadlines && deadlines.length > 0 ? (
        <div className="space-y-3">
          {deadlines.map((d) => {
            const daysLeft = Math.ceil((new Date(d.deadline_date).getTime() - Date.now()) / 86400000);
            const isUrgent = daysLeft <= 7;
            return (
              <Card key={d.id} className={`border ${isUrgent ? 'border-destructive/30' : ''}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`shrink-0 text-center min-w-[52px] rounded-lg py-2 px-2 ${isUrgent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <div className={`text-lg font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
                      {format(new Date(d.deadline_date), 'dd')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(d.deadline_date), 'MMM', { locale: ru })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{d.title}</h3>
                    {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{d.category}</span>
                      <span className={`text-xs font-medium ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {daysLeft === 0 ? 'Сегодня!' : daysLeft === 1 ? 'Завтра' : `через ${daysLeft} дн.`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">Нет ближайших дедлайнов.</p>
      )}
    </div>
  );
}
