import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, CalendarDays, AlertCircle,
  FileText, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  tax: { label: 'Налог', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🔴' },
  reporting: { label: 'Отчёт', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '🟡' },
  general: { label: 'Общий', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🔵' },
};

const professions = [
  { value: 'all', label: 'Все профессии' },
  { value: 'accountant', label: 'Бухгалтер' },
  { value: 'lawyer', label: 'Юрист' },
  { value: 'hr_specialist', label: 'Кадровик' },
  { value: 'economist', label: 'Экономист' },
  { value: 'entrepreneur', label: 'Предприниматель' },
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function formatCountdown(days: number) {
  if (days < 0) return 'просрочен';
  if (days === 0) return 'сегодня!';
  if (days === 1) return 'завтра';
  if (days <= 4) return `через ${days} дня`;
  return `через ${days} дней`;
}

export default function DeadlinesCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [typeFilter, setTypeFilter] = useState('all');
  const [profFilter, setProfFilter] = useState('all');

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['deadlines-calendar', year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from('deadlines')
        .select('*')
        .gte('deadline_date', startDate)
        .lte('deadline_date', endDate)
        .order('deadline_date');
      return data || [];
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: async () => {
      const todayStr = toDateStr(new Date());
      const { data } = await supabase
        .from('deadlines')
        .select('*')
        .gte('deadline_date', todayStr)
        .order('deadline_date')
        .limit(10);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!deadlines) return [];
    return deadlines.filter((d) => {
      if (typeFilter !== 'all' && d.deadline_type !== typeFilter) return false;
      if (profFilter !== 'all' && !(d.profession_tags || []).includes(profFilter)) return false;
      return true;
    });
  }, [deadlines, typeFilter, profFilter]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filtered.forEach((d) => {
      if (!map.has(d.deadline_date)) map.set(d.deadline_date, new Set());
      map.get(d.deadline_date)!.add(d.deadline_type);
    });
    return map;
  }, [filtered]);

  const selectedDeadlines = useMemo(
    () => filtered.filter((d) => d.deadline_date === selectedDate),
    [filtered, selectedDate]
  );

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(toDateStr(today));
  };

  const todayStr = toDateStr(today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Календарь дедлайнов</h1>
        <p className="text-sm text-muted-foreground mt-1">Налоговые и отчётные сроки на 2026 год</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-40 text-center">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs ml-1" onClick={goToday}>
            Сегодня
          </Button>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="tax">Налоговые</SelectItem>
            <SelectItem value="reporting">Отчётные</SelectItem>
            <SelectItem value="general">Общие</SelectItem>
          </SelectContent>
        </Select>
        <Select value={profFilter} onValueChange={setProfFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {professions.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_340px]">
        {/* Calendar grid */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-px mb-1">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {days.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="h-12" />;
                    const ds = toDateStr(day);
                    const isToday = ds === todayStr;
                    const isSelected = ds === selectedDate;
                    const hasDeadline = deadlinesByDate.has(ds);
                    const types = deadlinesByDate.get(ds);
                    const isPast = ds < todayStr;
                    return (
                      <button
                        key={ds}
                        onClick={() => setSelectedDate(ds)}
                        className={cn(
                          'relative h-12 flex flex-col items-center justify-center rounded-md text-sm transition-colors',
                          isSelected && 'ring-2 ring-primary',
                          isToday && !isSelected && 'bg-primary text-primary-foreground font-bold',
                          !isToday && !isSelected && 'hover:bg-accent',
                          isPast && !isToday && 'text-muted-foreground',
                        )}
                      >
                        {day.getDate()}
                        {hasDeadline && types && (
                          <span className="absolute bottom-1 flex gap-0.5">
                            {Array.from(types).slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  t === 'tax' ? 'bg-red-500' : t === 'reporting' ? 'bg-amber-500' : 'bg-blue-500',
                                )}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected day panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDeadlines.length > 0 ? (
              <div className="space-y-3">
                {selectedDeadlines.map((d) => {
                  const cfg = typeConfig[d.deadline_type] || typeConfig.general;
                  return (
                    <div key={d.id} className="flex gap-3 p-3 rounded-lg border">
                      <span className="text-lg shrink-0">{cfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={cn('text-[10px]', cfg.color)}>
                            {cfg.label}
                          </Badge>
                          {d.recurring && (
                            <Badge variant="outline" className="text-[10px]">Повторяющийся</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{d.title}</p>
                        {d.description && (
                          <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                        )}
                        {d.document_id && (
                          <Link
                            to={`/app/documents/${d.document_id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <FileText className="h-3 w-3" /> Смотреть НПА
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет дедлайнов на эту дату
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming deadlines */}
      {upcoming && upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ближайшие дедлайны</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {upcoming.map((d) => {
                const days = getDaysUntil(d.deadline_date);
                const cfg = typeConfig[d.deadline_type] || typeConfig.general;
                const urgent = days <= 3;
                return (
                  <div
                    key={d.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent',
                      urgent && 'border-destructive/30 bg-destructive/5',
                    )}
                    onClick={() => {
                      const dd = new Date(d.deadline_date + 'T00:00:00');
                      setYear(dd.getFullYear());
                      setMonth(dd.getMonth());
                      setSelectedDate(d.deadline_date);
                    }}
                  >
                    <span className="text-lg shrink-0">{cfg.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.deadline_date + 'T00:00:00').toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium whitespace-nowrap flex items-center gap-1',
                      urgent ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {urgent && <AlertCircle className="h-3 w-3" />}
                      <Clock className="h-3 w-3" />
                      {formatCountdown(days)}
                    </span>
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
