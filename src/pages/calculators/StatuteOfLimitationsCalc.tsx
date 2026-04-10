import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, addYears, addMonths, differenceInCalendarDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, CalendarIcon, Copy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const claimTypes = [
  { value: 'general', label: 'Общий — 3 года', years: 3, months: 0 },
  { value: 'labor', label: 'Трудовые споры — 3 месяца', years: 0, months: 3 },
  { value: 'dismissal', label: 'Обжалование увольнения — 1 месяц', years: 0, months: 1 },
] as const;

export default function StatuteOfLimitationsCalc() {
  const location = useLocation();
  const [date, setDate] = useState<Date | undefined>();
  const [type, setType] = useState('general');

  const result = useMemo(() => {
    if (!date) return null;
    const claim = claimTypes.find(c => c.value === type)!;
    let expiry = date;
    if (claim.years) expiry = addYears(expiry, claim.years);
    if (claim.months) expiry = addMonths(expiry, claim.months);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = differenceInCalendarDays(expiry, today);
    return { expiry, daysLeft, expired: daysLeft < 0 };
  }, [date, type]);

  const reset = () => { setDate(undefined); setType('general'); };

  const copyResult = () => {
    if (!result) return;
    const text = `Срок исковой давности\nДата возникновения: ${format(date!, 'dd.MM.yyyy')}\nТип: ${claimTypes.find(c => c.value === type)!.label}\nИстекает: ${format(result.expiry, 'dd.MM.yyyy')}\nОсталось дней: ${result.daysLeft}\nСтатус: ${result.expired ? 'Истёк' : 'Действует'}`;
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  const daysLabel = (n: number) => {
    const abs = Math.abs(n);
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
    return 'дней';
  };

  return (
    <>
      <PageSEO
        title="Калькулятор исковой давности — Бабиджон"
        description="Рассчитайте срок исковой давности по ст. 197 ГК РБ: общий (3 года), трудовые споры (3 мес), обжалование увольнения (1 мес)."
        path="/calculator/statute-of-limitations"
      />
      <div className="space-y-4">
        <Link
          to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Калькулятор исковой давности</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Дата возникновения права на иск</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal mt-1', !date && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Тип требования</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {claimTypes.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-3 w-3 mr-1" /> Сбросить
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className={cn(
                    'text-center p-4 rounded-lg',
                    result.expired ? 'bg-destructive/10' : 'bg-primary/5'
                  )}>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {result.expired ? (
                        <XCircle className="h-6 w-6 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                      <p className={cn('text-2xl font-bold', result.expired ? 'text-destructive' : 'text-primary')}>
                        {result.expired ? 'Истёк' : 'Действует'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Дата истечения</p>
                      <p className="font-semibold text-foreground">{format(result.expiry, 'dd.MM.yyyy')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">{result.expired ? 'Истёк' : 'Осталось'}</p>
                      <p className="font-semibold text-foreground">
                        {Math.abs(result.daysLeft)} {daysLabel(result.daysLeft)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyResult}>
                      <Copy className="h-3 w-3 mr-1" /> Копировать
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Выберите дату для расчёта
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Расчёт произведён согласно{' '}
          <Link to="/documents?q=статья 197 Гражданский кодекс" className="text-primary hover:underline">
            ст. 197 ГК РБ
          </Link>
          . Специальные сроки могут быть установлены иными законами.
        </p>
      </div>
    </>
  );
}
