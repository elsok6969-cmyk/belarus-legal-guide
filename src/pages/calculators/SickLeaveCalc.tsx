import { useState, useMemo } from 'react';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function SickLeaveCalc() {
  const location = useLocation();
  const [dailyPay, setDailyPay] = useState('');
  const [days, setDays] = useState('');

  const result = useMemo(() => {
    const dp = parseFloat(dailyPay) || 0;
    const d = Math.max(0, Math.floor(parseFloat(days) || 0));
    const first12 = Math.min(d, 12);
    const rest = Math.max(0, d - 12);
    const amountFirst = dp * first12 * 0.8;
    const amountRest = dp * rest;
    return { first12, rest, amountFirst, amountRest, total: amountFirst + amountRest };
  }, [dailyPay, days]);

  const reset = () => { setDailyPay(''); setDays(''); };

  const copyResult = () => {
    navigator.clipboard.writeText(
      `Больничный лист\nПервые ${result.first12} дн. (80%): ${fmt(result.amountFirst)} BYN\nС 13-го дня (${result.rest} дн., 100%): ${fmt(result.amountRest)} BYN\nИтого: ${fmt(result.total)} BYN`
    );
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO
        title="Калькулятор больничного — Бабиджон"
        description="Расчёт пособия по временной нетрудоспособности по законодательству РБ"
        path="/calculator/sick-leave"
      />
      <div className="space-y-4">
        <Link
          to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Калькулятор больничного</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Среднедневной заработок (BYN)</Label>
                <Input type="number" placeholder="0.00" value={dailyPay} onChange={(e) => setDailyPay(e.target.value)} />
              </div>
              <div>
                <Label>Количество дней больничного</Label>
                <Input type="number" placeholder="0" min="0" value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-3 w-3 mr-1" /> Сбросить
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Пособие итого</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.total)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Первые {result.first12} дн. (80%)</p>
                  <p className="font-semibold text-foreground">{fmt(result.amountFirst)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">С 13-го дня ({result.rest} дн., 100%)</p>
                  <p className="font-semibold text-foreground">{fmt(result.amountRest)} BYN</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Copy className="h-3 w-3 mr-1" /> Копировать
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3 w-3 mr-1" /> Печать
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {parseFloat(dailyPay) > 0 && parseInt(days) > 0 && (
          <InlineEmailForm
            source="calculator_sick_leave"
            title="Получите результат на email"
            description="Будьте в курсе изменений трудового законодательства"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Расчёт произведён согласно Закону РБ «О социальном страховании». Первые 12 календарных дней — 80% среднедневного заработка, с 13-го дня — 100%.
        </p>
      </div>
    </>
  );
}
