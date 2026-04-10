import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function TaxPenaltyCalc() {
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: rateData, isLoading } = useQuery({
    queryKey: ['refinancing-rate'],
    queryFn: async () => {
      const { data } = await supabase
        .from('economic_indicators')
        .select('current_value, effective_date')
        .eq('slug', 'refinancing-rate')
        .maybeSingle();
      return data;
    },
  });

  const refRate = parseFloat(rateData?.current_value || '9.75');

  const result = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (!startDate || !endDate) return { days: 0, penalty: 0, total: 0 };
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const penalty = amt * (refRate / 100 / 360) * days;
    return { days, penalty, total: amt + penalty };
  }, [amount, startDate, endDate, refRate]);

  const reset = () => { setAmount(''); setStartDate(''); setEndDate(new Date().toISOString().slice(0, 10)); };

  const copyResult = () => {
    navigator.clipboard.writeText(`Пеня по налогам\nСумма: ${amount} BYN\nДни просрочки: ${result.days}\nСтавка: ${refRate}%\nПеня: ${fmt(result.penalty)} BYN\nИтого: ${fmt(result.total)} BYN`);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Пеня по налогам — Калькулятор" description="Расчёт пени за просрочку уплаты налога" path="/app/calculator/tax-penalty" />
      <div className="space-y-4">
        <Link to="/app/calculator" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Пеня по налогам</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ставка рефинансирования: <span className="font-medium text-foreground">{refRate}%</span>
                  {rateData?.effective_date && <span> (с {new Date(rateData.effective_date).toLocaleDateString('ru-RU')})</span>}
                </p>
              )}
              <div>
                <Label>Сумма задолженности (BYN)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Дата возникновения</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Дата погашения</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Сумма пени</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.penalty)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Дни просрочки</p>
                  <p className="font-semibold text-foreground">{result.days}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Итого к уплате</p>
                  <p className="font-semibold text-foreground">{fmt(result.total)} BYN</p>
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
          Формула: Сумма × (Ставка рефинансирования / 360) × Дни просрочки. Ст. 55 НК РБ.
        </p>
        <OtherCalculators currentSlug="tax-penalty" />
      </div>
    </>
  );
}
