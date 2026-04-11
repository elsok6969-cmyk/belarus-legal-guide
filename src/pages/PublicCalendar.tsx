import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CalendarDays, ChevronLeft, ChevronRight, Download, Bell, ExternalLink, Mail,
} from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

type TaxDeadline = {
  id: string;
  title: string;
  description: string | null;
  deadline_date: string;
  tax_type: string | null;
  audience: string[] | null;
  document_url: string | null;
  is_recurring: boolean | null;
  recurrence_rule: string | null;
};

const TAX_TYPES = ['НДС', 'Прибыль', 'УСН', 'ФСЗН', 'Подоходный', 'Статотчётность'] as const;
const AUDIENCES = ['ИП', 'ООО', 'ОАО'] as const;

const TAX_TYPE_COLORS: Record<string, { dot: string; badge: string }> = {
  'НДС': { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  'Прибыль': { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  'УСН': { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'ФСЗН': { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'Подоходный': { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'Статотчётность': { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400' },
};

function generateICS(deadlines: TaxDeadline[], filename: string) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LegalPortal//TaxCalendar//RU'];
  deadlines.forEach((d) => {
    const dateStr = d.deadline_date.replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:${d.title}`,
      `DESCRIPTION:${d.description || ''}`,
      `UID:${d.id}@legalportal`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function PublicCalendar() {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaxType, setSelectedTaxType] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [subEmail, setSubEmail] = useState('');
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const { data: allDeadlines, isLoading, isError } = useQuery({
    queryKey: ['tax-deadlines-2026'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_deadlines')
        .select('*')
        .order('deadline_date');
      if (error) throw error;
      return (data || []) as TaxDeadline[];
    },
    retry: 2,
  });

  const filtered = useMemo(() => {
    if (!allDeadlines) return [];
    return allDeadlines.filter((d) => {
      if (selectedTaxType && d.tax_type !== selectedTaxType) return false;
      if (selectedAudience && !(d.audience || []).includes(selectedAudience)) return false;
      return true;
    });
  }, [allDeadlines, selectedTaxType, selectedAudience]);

  const upcoming30 = useMemo(() => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);
    return filtered.filter((d) => {
      const dd = new Date(d.deadline_date);
      return dd >= now && dd <= future;
    });
  }, [filtered]);

  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, TaxDeadline[]> = {};
    upcoming30.forEach((d) => {
      const key = d.deadline_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming30]);

  const deadlinesByDate = useMemo(() => {
    const map: Record<string, TaxDeadline[]> = {};
    filtered.forEach((d) => {
      if (!map[d.deadline_date]) map[d.deadline_date] = [];
      map[d.deadline_date].push(d);
    });
    return map;
  }, [filtered]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('calendar_subscriptions').insert({
        email: subEmail,
        tax_types: subTypes.length > 0 ? subTypes : null,
        audience: selectedAudience,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Вы подписаны на напоминания!');
      setSubEmail('');
      setSubTypes([]);
    },
    onError: () => toast.error('Ошибка при подписке'),
  });

  const toggleChip = useCallback((current: string | null, value: string) => {
    return current === value ? null : value;
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = (getDay(start) + 6) % 7; // Monday-based
    const padding: (Date | null)[] = Array(startDayOfWeek).fill(null);
    return [...padding, ...days];
  }, [currentMonth]);

  const renderCalendarGrid = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-base font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Сегодня
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-2">{wd}</div>
        ))}
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="h-14" />;
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayDeadlines = deadlinesByDate[dateKey] || [];
          const hasDeadlines = dayDeadlines.length > 0;
          const today = isToday(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          const cell = (
            <button
              key={dateKey}
              onClick={() => hasDeadlines && setSelectedDay(isSelected ? null : day)}
              className={`h-14 relative flex flex-col items-center justify-start pt-1.5 rounded-lg transition-colors
                ${!inMonth ? 'opacity-30' : ''}
                ${today ? 'ring-2 ring-teal-500' : ''}
                ${isSelected ? 'bg-primary/10' : hasDeadlines ? 'hover:bg-muted cursor-pointer' : ''}
              `}
            >
              <span className={`text-sm ${today ? 'font-bold text-teal-600 dark:text-teal-400' : ''}`}>
                {format(day, 'd')}
              </span>
              {hasDeadlines && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[40px]">
                  {[...new Set(dayDeadlines.map((d) => d.tax_type))].slice(0, 3).map((type, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${TAX_TYPE_COLORS[type || '']?.dot || 'bg-muted-foreground'}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );

          if (hasDeadlines && isSelected) {
            return (
              <Popover key={dateKey} open onOpenChange={(open) => !open && setSelectedDay(null)}>
                <PopoverTrigger asChild>{cell}</PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="center">
                  <p className="font-semibold text-sm mb-2">
                    {format(day, 'd MMMM', { locale: ru })}
                  </p>
                  <div className="space-y-2">
                    {dayDeadlines.map((d) => (
                      <div key={d.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${TAX_TYPE_COLORS[d.tax_type || '']?.dot || 'bg-muted-foreground'}`} />
                          <span className="font-medium">{d.title}</span>
                        </div>
                        {d.description && <p className="text-muted-foreground pl-3.5">{d.description}</p>}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return cell;
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
        {TAX_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${TAX_TYPE_COLORS[t].dot}`} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );

  const daysLeft = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageSEO
        title="Налоговый календарь 2026 — сроки отчётности РБ | Бабиджон"
        description="Все сроки уплаты налогов и сдачи отчётности: НДС, налог на прибыль, ФСЗН."
        path="/calendar"
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Налоговый календарь' },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          Налоговый календарь 2026
        </h1>
        <p className="text-muted-foreground mt-1">Все важные даты для бухгалтера и ИП в Беларуси</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={selectedTaxType === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTaxType(null)}
          >
            Все типы
          </Badge>
          {TAX_TYPES.map((t) => (
            <Badge
              key={t}
              variant={selectedTaxType === t ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedTaxType === t ? '' : TAX_TYPE_COLORS[t].badge}`}
              onClick={() => setSelectedTaxType(toggleChip(selectedTaxType, t))}
            >
              {t}
            </Badge>
          ))}
        </div>
        <div className="w-px h-6 bg-border self-center mx-1 hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={selectedAudience === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedAudience(null)}
          >
            Все
          </Badge>
          {AUDIENCES.map((a) => (
            <Badge
              key={a}
              variant={selectedAudience === a ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedAudience(toggleChip(selectedAudience, a))}
            >
              {a}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
        {/* Left: Calendar */}
        <div>
          {isMobile ? (
            <Dialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Показать календарь
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Календарь</DialogTitle>
                </DialogHeader>
                {renderCalendarGrid()}
              </DialogContent>
            </Dialog>
          ) : (
            <Card>
              <CardContent className="p-4">
                {renderCalendarGrid()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Upcoming */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ближайшие 30 дней</h2>
            {upcoming30.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateICS(filtered, 'calendar-2026.ics')}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                ICS
              </Button>
            )}
          </div>

          {isError ? (
            <p className="text-sm text-destructive text-center py-8">Не удалось загрузить данные. Попробуйте обновить страницу.</p>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : groupedUpcoming.length > 0 ? (
            <div className="space-y-4">
              {groupedUpcoming.map(([dateStr, items]) => {
                const dl = daysLeft(dateStr);
                const isUrgent = dl <= 3;
                return (
                  <div key={dateStr}>
                    <p className={`text-xs font-semibold mb-1.5 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {format(new Date(dateStr), 'd MMMM, EEEE', { locale: ru })}
                      {dl === 0 ? ' — сегодня!' : dl === 1 ? ' — завтра' : ` — через ${dl} дн.`}
                    </p>
                    <div className="space-y-2">
                      {items.map((d) => (
                        <Card key={d.id} className={`${isUrgent ? 'border-destructive/30' : ''}`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className={TAX_TYPE_COLORS[d.tax_type || '']?.badge || ''}>
                                    {d.tax_type}
                                  </Badge>
                                  <span className="text-sm font-medium">{d.title}</span>
                                </div>
                                {d.description && (
                                  <p className="text-xs text-muted-foreground">{d.description}</p>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  {d.document_url && (
                                    <a
                                      href={d.document_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      НПА
                                    </a>
                                  )}
                                  <button
                                    onClick={() => generateICS([d], `${d.title}.ics`)}
                                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                  >
                                    <CalendarDays className="h-3 w-3" />
                                    В календарь
                                  </button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет дедлайнов в ближайшие 30 дней по выбранным фильтрам
            </p>
          )}

          {/* Export all */}
          {filtered.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generateICS(filtered, 'calendar-2026.ics')}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать все дедлайны (ICS)
            </Button>
          )}
        </div>
      </div>

      {/* Email subscription */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Получайте напоминания за 7 и 1 день до дедлайна
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-[1fr_auto] gap-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Ваш email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                {TAX_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={subTypes.includes(t)}
                      onCheckedChange={(checked) =>
                        setSubTypes((prev) =>
                          checked ? [...prev, t] : prev.filter((x) => x !== t)
                        )
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={() => subscribeMutation.mutate()}
              disabled={!subEmail || subscribeMutation.isPending}
              className="self-start"
            >
              <Mail className="mr-2 h-4 w-4" />
              Подписаться
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
