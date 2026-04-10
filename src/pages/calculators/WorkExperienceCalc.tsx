import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OtherCalculators } from '@/components/calculators/OtherCalculators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, Copy, Printer, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Period {
  id: number;
  start: string;
  end: string;
  org: string;
}

let nextId = 1;

export default function WorkExperienceCalc() {
  const [periods, setPeriods] = useState<Period[]>([{ id: nextId++, start: '', end: '', org: '' }]);

  const addPeriod = () => setPeriods((p) => [...p, { id: nextId++, start: '', end: '', org: '' }]);
  const removePeriod = (id: number) => setPeriods((p) => p.filter((x) => x.id !== id));
  const updatePeriod = (id: number, field: keyof Period, value: string) =>
    setPeriods((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const result = useMemo(() => {
    let totalDays = 0;
    for (const p of periods) {
      if (!p.start || !p.end) continue;
      const s = new Date(p.start + 'T00:00:00');
      const e = new Date(p.end + 'T00:00:00');
      const diff = Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000));
      totalDays += diff;
    }
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays % 365 % 30;
    return { years, months, days, totalDays };
  }, [periods]);

  const reset = () => { setPeriods([{ id: nextId++, start: '', end: '', org: '' }]); };

  const label = `${result.years} лет ${result.months} мес. ${result.days} дн.`;

  const copyResult = () => {
    navigator.clipboard.writeText(`Трудовой стаж: ${label} (${result.totalDays} дней)`);
    toast.success('Скопировано');
  };

  return (
    <>
      <PageSEO title="Трудовой стаж — Калькулятор" description="Подсчёт общего трудового стажа" path="/app/calculator/work-experience" />
      <div className="space-y-4">
        <Link to="/app/calculator" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Все калькуляторы
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Трудовой стаж</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Периоды работы</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {periods.map((p, i) => (
                <div key={p.id} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Период {i + 1}</span>
                    {periods.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePeriod(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Начало</Label>
                      <Input type="date" value={p.start} onChange={(e) => updatePeriod(p.id, 'start', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Окончание</Label>
                      <Input type="date" value={p.end} onChange={(e) => updatePeriod(p.id, 'end', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Организация (необяз.)</Label>
                    <Input placeholder="Название" value={p.org} onChange={(e) => updatePeriod(p.id, 'org', e.target.value)} />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addPeriod}><Plus className="h-3 w-3 mr-1" /> Добавить период</Button>
                <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3 w-3 mr-1" /> Сбросить</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-4"><CardTitle className="text-base">Результат</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Общий трудовой стаж</p>
                <p className="text-2xl font-bold text-primary mt-1">{label}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.totalDays} календарных дней</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResult}><Copy className="h-3 w-3 mr-1" /> Копировать</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" /> Печать</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Расчёт носит информационный характер. Для точного подсчёта обратитесь в отдел кадров.
        </p>
        <OtherCalculators currentSlug="work-experience" />
      </div>
    </>
  );
}
