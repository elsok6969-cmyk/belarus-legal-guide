import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function VacationPayCalc() {
  const [dailyWage, setDailyWage] = useState('');
  const [days, setDays] = useState('24');

  const result = useMemo(() => {
    const dw = parseFloat(dailyWage) || 0;
    const d = parseInt(days) || 0;
    const gross = dw * d;
    const tax = gross * 0.13;
    const net = gross - tax;
    return { gross, tax, net };
  }, [dailyWage, days]);

  const reset = () => { setDailyWage(''); setDays('24'); };

  const copyResult = () => {
    navigator.clipboard.writeText(`Отпускные\nСреднедневной: ${dailyWage} BYN\nДни: ${days}\nНачислено: ${fmt(result.gross)} BYN\nПодоходный: ${fmt(result.tax)} BYN\nК выплате: ${fmt(result.net)} BYN`);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Расчёт отпускных — Калькулятор" description="Расчёт суммы отпускных в РБ" path="/app/calculator/vacation-pay" />
      <div className="space-y-4">
        <Link to="/app/calculator" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Расчёт отпускных</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Среднедневной заработок (BYN)</Label>
                <Input type="number" placeholder="0.00" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Сумма ЗП за 12 месяцев / количество отработанных дней</p>
              </div>
              <div>
                <Label>Количество дней отпуска</Label>
                <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">К выплате</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.net)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Начислено</p>
                  <p className="font-semibold text-foreground">{fmt(result.gross)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Подоходный (13%)</p>
                  <p className="font-semibold text-foreground">{fmt(result.tax)} BYN</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Расчёт произведён согласно ст. 176 Трудового кодекса РБ.
        </p>
      </div>
    </>
  );
}
