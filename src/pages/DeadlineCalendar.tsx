import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const placeholderDeadlines = [
  { date: '20.04.2026', title: 'Декларация по НДС за I квартал', type: 'Налоги' },
  { date: '22.04.2026', title: 'Декларация по налогу на прибыль за I квартал', type: 'Налоги' },
  { date: '22.04.2026', title: 'Отчёт 4-фонд за I квартал', type: 'ФСЗН' },
  { date: '30.04.2026', title: 'Бухгалтерская отчётность за I квартал', type: 'Бухучёт' },
];

export default function DeadlineCalendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Календарь сроков</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ближайшие сроки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {placeholderDeadlines.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                <span className="font-mono text-sm font-medium whitespace-nowrap">{d.date}</span>
                <div className="flex-1">
                  <p className="text-sm">{d.title}</p>
                </div>
                <Badge variant="outline" className="text-xs">{d.type}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Данные будут загружаться из базы данных. Это заглушка.</p>
        </CardContent>
      </Card>
    </div>
  );
}
