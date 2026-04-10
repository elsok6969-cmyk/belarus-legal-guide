import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Все',
  accountant: 'Бухгалтер',
  lawyer: 'Юрист',
  general: 'Общее',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Налоги': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'ФСЗН': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Бухучёт': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Статистика': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Суды': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  'Корпоративное': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function DeadlineCalendar() {
  const [audience, setAudience] = useState('all');
  const [category, setCategory] = useState('all');

  const { data: deadlines, isLoading, isError } = useQuery({
    queryKey: ['deadlines', audience, category],
    queryFn: async () => {
      let q = supabase
        .from('deadline_calendar')
        .select('*')
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .order('deadline_date');

      if (audience !== 'all') q = q.eq('audience', audience as any);
      if (category !== 'all') q = q.eq('category', category);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    retry: 2,
  });

  const { data: categories } = useQuery({
    queryKey: ['deadline-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deadline_calendar').select('category');
      if (error) throw error;
      return [...new Set(data.map((d) => d.category))];
    },
  });

  const getDaysLeft = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Календарь сроков</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все аудитории</SelectItem>
            <SelectItem value="accountant">Бухгалтер</SelectItem>
            <SelectItem value="lawyer">Юрист</SelectItem>
            <SelectItem value="general">Общее</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ближайшие сроки</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive text-center py-8">
              Не удалось загрузить данные. Попробуйте обновить страницу.
            </p>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-md bg-muted/50">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : deadlines && deadlines.length > 0 ? (
            <div className="space-y-3">
              {deadlines.map((d) => {
                const daysLeft = getDaysLeft(d.deadline_date);
                const isUrgent = daysLeft <= 7;
                const isSoon = daysLeft <= 14;
                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-lg border ${
                      isUrgent
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                        : isSoon
                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {isUrgent && <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />}
                          <p className="font-medium text-sm">{d.title}</p>
                        </div>
                        {d.description && (
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="secondary" className={CATEGORY_COLORS[d.category] || ''}>
                            {d.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {AUDIENCE_LABELS[d.audience] || d.audience}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-medium">
                          {new Date(d.deadline_date).toLocaleDateString('ru-RU')}
                        </p>
                        <p className={`text-xs flex items-center justify-end gap-1 ${
                          isUrgent ? 'text-red-600 font-medium' : isSoon ? 'text-amber-600' : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {daysLeft === 0 ? 'Сегодня!' : daysLeft === 1 ? 'Завтра' : `${daysLeft} дн.`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет предстоящих сроков по выбранным фильтрам
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
