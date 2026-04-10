import { useState, useMemo } from 'react';
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

const locations = [
  { value: '1.5', label: 'Минск (центр) — 1.5' },
  { value: '1.2', label: 'Минск — 1.2' },
  { value: '1.0', label: 'Областной город — 1.0' },
  { value: '0.8', label: 'Районный центр — 0.8' },
  { value: '0.5', label: 'Сельская местность — 0.5' },
];

const floors = [
  { value: '1.2', label: '1 этаж — 1.2' },
  { value: '1.0', label: '2–4 этаж — 1.0' },
  { value: '0.9', label: '5+ этаж — 0.9' },
  { value: '0.5', label: 'Подвал — 0.5' },
];

export default function RentCalc() {
  const location = useLocation();
  const [area, setArea] = useState('');
  const [bav, setBav] = useState('20.03');
  const [locCoef, setLocCoef] = useState('1.2');
  const [floorCoef, setFloorCoef] = useState('1.0');

  const result = useMemo(() => {
    const a = parseFloat(area) || 0;
    const b = parseFloat(bav) || 0;
    const lc = parseFloat(locCoef);
    const fc = parseFloat(floorCoef);
    const monthly = a * b * lc * fc;
    return { monthly, perSqm: a > 0 ? monthly / a : 0, yearly: monthly * 12 };
  }, [area, bav, locCoef, floorCoef]);

  const reset = () => { setArea(''); setBav('20.03'); setLocCoef('1.2'); setFloorCoef('1.0'); };

  const copyResult = () => {
    navigator.clipboard.writeText(`Аренда\nПлощадь: ${area} м²\nПлата/мес: ${fmt(result.monthly)} BYN\nЗа м²: ${fmt(result.perSqm)} BYN\nЗа год: ${fmt(result.yearly)} BYN`);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Калькулятор арендной платы — Бабиджон" description="Расчёт арендной платы по базовой арендной величине" path="/calculator/rent" />
      <div className="space-y-4">
        <Link to={location.pathname.startsWith('/app/') ? '/app/calculator' : '/calculator'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Калькулятор арендной платы</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Входные данные</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Площадь (м²)</Label>
                <Input type="number" placeholder="0" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div>
                <Label>Базовая арендная величина (BYN)</Label>
                <Input type="number" placeholder="20.03" value={bav} onChange={(e) => setBav(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Текущая БАВ — 20,03 BYN</p>
              </div>
              <div>
                <Label>Коэффициент расположения</Label>
                <Select value={locCoef} onValueChange={setLocCoef}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{locations.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Коэффициент этажности</Label>
                <Select value={floorCoef} onValueChange={setFloorCoef}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{floors.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Плата в месяц</p>
                <p className="text-3xl font-bold text-primary">{fmt(result.monthly)} BYN</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">За 1 м²/мес</p>
                  <p className="font-semibold text-foreground">{fmt(result.perSqm)} BYN</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">За год</p>
                  <p className="font-semibold text-foreground">{fmt(result.yearly)} BYN</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {result.monthly > 0 && <InlineEmailForm source="calculator_rent" title="Получите результат на email" description="Будьте в курсе изменений базовой арендной величины" />}
        <p className="text-xs text-muted-foreground">Расчёт на основе Указа Президента РБ № 150. Формула: площадь × БАВ × коэф. расположения × коэф. этажности.</p>
        <OtherCalculators currentSlug="rent" />
      </div>
    </>
  );
}
