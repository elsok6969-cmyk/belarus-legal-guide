import { PageSEO } from '@/components/shared/PageSEO';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

const MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];

const DATA: { days: number; hours: number; weekends: number; holidays: number; holidayName?: string }[] = [
  { days: 20, hours: 151, weekends: 11, holidays: 1, holidayName: 'Новый год' },
  { days: 20, hours: 160, weekends: 8, holidays: 0 },
  { days: 22, hours: 175, weekends: 9, holidays: 1, holidayName: 'День женщин' },
  { days: 21, hours: 166, weekends: 9, holidays: 0 },
  { days: 20, hours: 159, weekends: 11, holidays: 2, holidayName: 'Праздник труда, День Победы' },
  { days: 21, hours: 168, weekends: 9, holidays: 0 },
  { days: 23, hours: 184, weekends: 8, holidays: 1, holidayName: 'День Независимости' },
  { days: 21, hours: 168, weekends: 10, holidays: 0 },
  { days: 22, hours: 176, weekends: 8, holidays: 0 },
  { days: 22, hours: 176, weekends: 9, holidays: 0 },
  { days: 20, hours: 160, weekends: 10, holidays: 1, holidayName: 'День Октябрьской революции' },
  { days: 22, hours: 175, weekends: 9, holidays: 1, holidayName: 'Рождество (католическое)' },
];

const holidays = [
  { date: '1 января', name: 'Новый год' },
  { date: '7 января', name: 'Рождество Христово (православное)' },
  { date: '8 марта', name: 'День женщин' },
  { date: '1 мая', name: 'Праздник труда' },
  { date: '9 мая', name: 'День Победы' },
  { date: '3 июля', name: 'День Независимости Республики Беларусь' },
  { date: '7 ноября', name: 'День Октябрьской революции' },
  { date: '25 декабря', name: 'Рождество Христово (католическое)' },
];

const currentMonth = new Date().getMonth(); // 0-based

const totals = DATA.reduce(
  (acc, m) => ({
    days: acc.days + m.days,
    hours: acc.hours + m.hours,
    weekends: acc.weekends + m.weekends,
    holidays: acc.holidays + m.holidays,
  }),
  { days: 0, hours: 0, weekends: 0, holidays: 0 },
);

export default function ProductionCalendar() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <PageSEO
        title="Производственный календарь Беларуси 2026 — рабочие дни и часы | Бабиджон"
        description="Производственный календарь Республики Беларусь на 2026 год: рабочие дни, часы, выходные и государственные праздники."
        path="/production-calendar"
      />

      <h1 className="text-2xl md:text-3xl font-bold">Производственный календарь Беларуси 2026</h1>
      <p className="text-muted-foreground mt-2 mb-8">Рабочие дни, часы и праздники</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Месяц</th>
              <th className="text-center px-4 py-3 font-medium">Рабочих дней</th>
              <th className="text-center px-4 py-3 font-medium">Рабочих часов</th>
              <th className="text-center px-4 py-3 font-medium">Выходных</th>
              <th className="text-center px-4 py-3 font-medium">Праздников</th>
            </tr>
          </thead>
          <tbody>
            {DATA.map((row, i) => (
              <tr
                key={i}
                className={`border-t ${i === currentMonth ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/30'} transition-colors`}
              >
                <td className="px-4 py-3">{MONTHS[i]}</td>
                <td className="text-center px-4 py-3">{row.days}</td>
                <td className="text-center px-4 py-3">{row.hours}</td>
                <td className="text-center px-4 py-3">{row.weekends}</td>
                <td className="text-center px-4 py-3">
                  {row.holidays > 0 ? (
                    <span>{row.holidays} ({row.holidayName})</span>
                  ) : (
                    '0'
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/50 font-bold">
              <td className="px-4 py-3">Итого</td>
              <td className="text-center px-4 py-3">{totals.days}</td>
              <td className="text-center px-4 py-3">{totals.hours}</td>
              <td className="text-center px-4 py-3">{totals.weekends}</td>
              <td className="text-center px-4 py-3">{totals.holidays}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Holidays */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground/60" />
            Государственные праздники Республики Беларусь
          </h2>
          <ul className="space-y-3">
            {holidays.map((h) => (
              <li key={h.date} className="flex items-baseline gap-3 text-sm">
                <span className="font-medium whitespace-nowrap min-w-[90px]">{h.date}</span>
                <span className="text-muted-foreground">—</span>
                <span>{h.name}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </article>
  );
}
