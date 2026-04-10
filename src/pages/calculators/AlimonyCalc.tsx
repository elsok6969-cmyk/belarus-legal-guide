import { useState, useMemo } from 'react';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const children = [
  { value: '1', label: '1 ребёнок', pct: 25 },
  { value: '2', label: '2 детей', pct: 33 },
  { value: '3', label: '3 и более', pct: 50 },
];

export default function AlimonyCalc() {
  const location = useLocation();
  const [income, setIncome] = useState('');
  const [count, setCount] = useState('1');

  const result = useMemo(() => {
    const inc = parseFloat(income) || 0;
    const pct = children.find((c) => c.value === count)!.pct;
    const alimony = inc * pct / 100;
    return { alimony, pct, remaining: inc - alimony };
  }, [income, count]);

  const reset = () => { setIncome(''); setCount('1'); };

  const copyResult = () => {
    const pct = children.find((c) => c.value === count)!.pct;
    navigator.clipboard.writeText(
      `Алименты (${pct}%)\nДоход: ${fmt(parseFloat(income) || 0)} BYN\nАлименты: ${fmt(result.alimony)} BYN\nОстаток: ${fmt(result.remaining)} BYN`
    );
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO
        title="Калькулятор алиментов — Бабиджон"
        description="Расчёт алиментов на детей по законодательству РБ"
        path="/calculator/alimony"
      />
      <div className="space-y-4">
        <Link
          to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Калькулятор алиментов</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Доход плательщика (BYN)</Label>
                <Input type="number" placeholder="0.00" value={income} onChange={(e) => setIncome(e.target.value)} />
              </div>
              <div>
                <Label>Количество детей</Label>
                <RadioGroup value={count} onValueChange={setCount} className="mt-2">
                  {children.map((c) => (
                    <div key={c.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={c.value} id={`child-${c.value}`} />
                      <Label htmlFor={`child-${c.value}`} className="font-normal cursor-pointer">
                        {c.label} — {c.pct}%
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
                <p className="text-sm text-muted-foreground">Сумма алиментов ({result.pct}%)</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.alimony)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">% от дохода</p>
                  <p className="font-semibold text-foreground">{result.pct}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Доход после</p>
                  <p className="font-semibold text-foreground">{fmt(result.remaining)} BYN</p>
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

        {parseFloat(income) > 0 && (
          <InlineEmailForm
            source="calculator_alimony"
            title="Получите результат на email"
            description="Будьте в курсе изменений семейного законодательства"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Расчёт произведён согласно{' '}
          <a
            href="https://pravo.by/document/?guid=3871&p0=hk9900278"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            ст. 92 КоБС РБ
          </a>
          . Минимальные размеры алиментов: 1 ребёнок — 25%, 2 детей — 33%, 3 и более — 50% заработка.
        </p>
        <OtherCalculators currentSlug="alimony" />
      </div>
    </>
  );
}
