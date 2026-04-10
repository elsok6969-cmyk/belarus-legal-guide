import { useState, useMemo } from 'react';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const PARAMS: Record<string, { stdDeduction: number; stdLimit: number; childDeduction: number }> = {
  '2024': { stdDeduction: 156, stdLimit: 944, childDeduction: 46 },
  '2025': { stdDeduction: 165, stdLimit: 998, childDeduction: 48 },
  '2026': { stdDeduction: 174, stdLimit: 1054, childDeduction: 51 },
};

const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function IncomeTaxCalc() {
  const location = useLocation();
  const [income, setIncome] = useState('');
  const [year, setYear] = useState('2026');
  const [useStd, setUseStd] = useState(true);
  const [children, setChildren] = useState('0');
  const [dependents, setDependents] = useState('0');

  const result = useMemo(() => {
    const inc = parseFloat(income) || 0;
    const p = PARAMS[year];
    let deductions = 0;
    if (useStd && inc <= p.stdLimit) deductions += p.stdDeduction;
    deductions += (parseInt(children) || 0) * p.childDeduction;
    deductions += (parseInt(dependents) || 0) * p.childDeduction;
    const taxable = Math.max(0, inc - deductions);
    const tax = taxable * 0.13;
    const effective = inc > 0 ? (tax / inc) * 100 : 0;
    const net = inc - tax;
    return { tax, effective, net, deductions, taxable };
  }, [income, year, useStd, children, dependents]);

  const reset = () => { setIncome(''); setYear('2026'); setUseStd(true); setChildren('0'); setDependents('0'); };

  const copyResult = () => {
    const text = `Подоходный налог (${year})\nДоход: ${income} BYN\nВычеты: ${fmt(result.deductions)} BYN\nНалог: ${fmt(result.tax)} BYN\nЭффективная ставка: ${result.effective.toFixed(2)}%\nДоход после налога: ${fmt(result.net)} BYN`;
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Подоходный налог — Калькулятор" description="Расчёт подоходного налога РБ" path="/app/calculator/income-tax" />
      <div className="space-y-4">
        <Link to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Подоходный налог</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Доход (BYN)</Label>
                <Input type="number" placeholder="0.00" value={income} onChange={(e) => setIncome(e.target.value)} />
              </div>
              <div>
                <Label>Год</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="std" checked={useStd} onCheckedChange={(v) => setUseStd(!!v)} />
                <Label htmlFor="std" className="cursor-pointer">Стандартный вычет ({PARAMS[year].stdDeduction} BYN при доходе &lt; {PARAMS[year].stdLimit} BYN)</Label>
              </div>
              <div>
                <Label>Количество детей</Label>
                <Input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} />
              </div>
              <div>
                <Label>Количество иждивенцев</Label>
                <Input type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Налог к уплате</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.tax)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Вычеты</p>
                  <p className="font-semibold text-foreground">{fmt(result.deductions)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Облагаемый доход</p>
                  <p className="font-semibold text-foreground">{fmt(result.taxable)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Эффективная ставка</p>
                  <p className="font-semibold text-foreground">{result.effective.toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Доход после налога</p>
                  <p className="font-semibold text-foreground">{fmt(result.net)} BYN</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {parseFloat(income) > 0 && (
          <InlineEmailForm
            source="calculator_income_tax"
            title="Получите результат на email"
            description="Будьте в курсе изменений налоговых ставок и вычетов"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Расчёт произведён согласно НК РБ, глава 18. Ставка 13%. Вычеты актуальны на {year} год.
        </p>
        <OtherCalculators currentSlug="income-tax" />
      </div>
    </>
  );
}
