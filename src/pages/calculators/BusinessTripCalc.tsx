import { useState, useMemo, useEffect } from 'react';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const countries = [
  { value: 'by', label: 'Беларусь', defaultRate: 45, currency: 'BYN' },
  { value: 'ru', label: 'Россия', defaultRate: 35, currency: 'USD' },
  { value: 'other', label: 'Другая страна', defaultRate: 50, currency: 'USD' },
];

export default function BusinessTripCalc() {
  const location = useLocation();
  const [country, setCountry] = useState('by');
  const [days, setDays] = useState('');
  const [rate, setRate] = useState('45');

  const selected = countries.find((c) => c.value === country)!;

  useEffect(() => {
    const c = countries.find((c) => c.value === country)!;
    setRate(String(c.defaultRate));
  }, [country]);

  const result = useMemo(() => {
    const d = Math.max(0, Math.floor(parseFloat(days) || 0));
    const r = parseFloat(rate) || 0;
    const total = d * r;
    return { days: d, perDay: r, total };
  }, [days, rate]);

  const reset = () => { setCountry('by'); setDays(''); setRate('45'); };

  const copyResult = () => {
    navigator.clipboard.writeText(
      `Командировка: ${selected.label}\nСуточные: ${fmt(result.perDay)} ${selected.currency}/день\nДней: ${result.days}\nИтого: ${fmt(result.total)} ${selected.currency}`
    );
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Калькулятор командировочных — Бабиджон" description="Расчёт суточных и аванса для командировки" path="/calculator/business-trip" />
      <div className="space-y-4">
        <Link to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Калькулятор командировочных</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Страна командировки</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Количество дней</Label>
                <Input type="number" placeholder="0" min="0" value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
              <div>
                <Label>Суточные ({selected.currency}/день)</Label>
                <Input type="number" placeholder="0.00" value={rate} onChange={(e) => setRate(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Норма: {selected.label} — {selected.defaultRate} {selected.currency}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Итого аванс</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.total)} {selected.currency}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Суточные итого</p>
                  <p className="font-semibold text-foreground">{fmt(result.total)} {selected.currency}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Суточные/день</p>
                  <p className="font-semibold text-foreground">{fmt(result.perDay)} {selected.currency}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {result.total > 0 && <InlineEmailForm source="calculator_business_trip" title="Получите результат на email" description="Будьте в курсе изменений норм командировочных расходов" />}
        <p className="text-xs text-muted-foreground">Нормы суточных установлены Постановлением Минфина РБ. Суточные по Беларуси — 45 BYN, Россия — 35 USD.</p>
        <OtherCalculators currentSlug="business-trip" />
      </div>
    </>
  );
}
