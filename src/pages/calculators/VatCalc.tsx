import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function VatCalc() {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'extract' | 'add'>('extract');
  const [rate, setRate] = useState('20');

  const result = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(rate);
    if (direction === 'extract') {
      const vat = a * r / (100 + r);
      return { withoutVat: a - vat, vat, withVat: a };
    } else {
      const vat = a * r / 100;
      return { withoutVat: a, vat, withVat: a + vat };
    }
  }, [amount, direction, rate]);

  const reset = () => { setAmount(''); setDirection('extract'); setRate('20'); };

  const copyResult = () => {
    navigator.clipboard.writeText(`НДС (${rate}%)\nСумма без НДС: ${fmt(result.withoutVat)} BYN\nНДС: ${fmt(result.vat)} BYN\nСумма с НДС: ${fmt(result.withVat)} BYN`);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Калькулятор НДС — Бабиджон" description="Выделить или начислить НДС" />
      <div className="space-y-4">
        <Link to="/app/calculator" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Калькулятор НДС</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Сумма (BYN)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Операция</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as 'extract' | 'add')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extract">Выделить НДС из суммы</SelectItem>
                    <SelectItem value="add">Начислить НДС на сумму</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ставка НДС</Label>
                <Select value={rate} onValueChange={setRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">НДС ({rate}%)</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.vat)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Сумма без НДС</p>
                  <p className="font-semibold text-foreground">{fmt(result.withoutVat)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Сумма с НДС</p>
                  <p className="font-semibold text-foreground">{fmt(result.withVat)} BYN</p>
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
          Расчёт произведён согласно главе 14 НК РБ. Ставки НДС: 20%, 10%, 25%, 0%.
        </p>
      </div>
    </>
  );
}
