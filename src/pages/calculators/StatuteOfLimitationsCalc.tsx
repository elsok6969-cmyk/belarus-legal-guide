import { useState, useMemo } from 'react';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { Link, useLocation } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { addYears, addMonths, differenceInCalendarDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';

const claimTypes = [
  { value: 'general', label: 'Общий — 3 года', years: 3, months: 0 },
  { value: 'labor', label: 'Трудовые споры — 3 месяца', years: 0, months: 3 },
  { value: 'dismissal', label: 'Обжалование увольнения — 1 месяц', years: 0, months: 1 },
];

export default function StatuteOfLimitationsCalc() {
  const location = useLocation();
  const [dateStr, setDateStr] = useState('');
  const [type, setType] = useState('general');

  const result = useMemo(() => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const claim = claimTypes.find((c) => c.value === type)!;
    let expiry = date;
    if (claim.years) expiry = addYears(expiry, claim.years);
    if (claim.months) expiry = addMonths(expiry, claim.months);
    const daysLeft = differenceInCalendarDays(expiry, new Date());
    return { expiry, daysLeft, expired: daysLeft < 0 };
  }, [dateStr, type]);

  const reset = () => { setDateStr(''); setType('general'); };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Исковая давность\nДата истечения: ${format(result.expiry, 'd MMMM yyyy', { locale: ru })}\nОсталось дней: ${result.daysLeft}\nСтатус: ${result.expired ? 'Истёк' : 'Действует'}`
    );
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Калькулятор исковой давности — Бабиджон" description="Проверьте срок исковой давности по ст. 197 ГК РБ" path="/calculator/statute-of-limitations" />
      <div className="space-y-4">
        <Link to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Калькулятор исковой давности</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Дата возникновения права на иск</Label>
                <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
              </div>
              <div>
                <Label>Тип требования</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {claimTypes.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className={`text-center p-4 rounded-lg ${result.expired ? 'bg-destructive/10' : 'bg-primary/5'}`}>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <p className={`text-3xl font-bold ${result.expired ? 'text-destructive' : 'text-primary'}`}>
                      {result.expired ? '❌ Истёк' : '✅ Действует'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Дата истечения</p>
                      <p className="font-semibold text-foreground">{format(result.expiry, 'd MMMM yyyy', { locale: ru })}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Осталось дней</p>
                      <p className="font-semibold text-foreground">{result.daysLeft}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Укажите дату для расчёта</p>
              )}
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground">
          Расчёт согласно{' '}
          <a href="https://pravo.by/document/?guid=3871&p0=hk9800218" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">ст. 197 ГК РБ</a>.
        </p>
        <OtherCalculators currentSlug="statute-of-limitations" />
      </div>
    </>
  );
}
