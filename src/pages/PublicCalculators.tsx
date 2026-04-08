import { Link } from 'react-router-dom';
import { PageSEO } from '@/components/shared/PageSEO';
import { Badge } from '@/components/ui/badge';

const calculators = [
  { emoji: '💰', title: 'Калькулятор НДС', desc: 'Выделить или начислить НДС', slug: 'nds', ready: true },
  { emoji: '📊', title: 'Подоходный налог', desc: 'Расчёт подоходного налога 13%', slug: 'income-tax', ready: true },
  { emoji: '📈', title: 'Пени по налогам', desc: 'Расчёт пени за просрочку', slug: 'penalty', ready: false },
  { emoji: '🏖', title: 'Отпускные', desc: 'Расчёт суммы отпускных', slug: 'vacation', ready: false },
  { emoji: '📋', title: 'Трудовой стаж', desc: 'Подсчёт общего стажа', slug: 'experience', ready: false },
  { emoji: '🏢', title: 'Арендная плата', desc: 'Расчёт аренды госимущества', slug: 'rent', ready: false },
];

export default function PublicCalculators() {
  return (
    <>
      <PageSEO
        title="Калькуляторы — Бабиджон"
        description="Онлайн-расчёты для бухгалтеров и предпринимателей: НДС, подоходный налог, пени, отпускные"
        path="/calculator"
      />
      <div className="container max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Калькуляторы</h1>
          <p className="text-muted-foreground mt-1">Онлайн-расчёты для бухгалтеров и предпринимателей</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculators.map((c) =>
            c.ready ? (
              <Link
                key={c.slug}
                to={`/calculator/${c.slug}`}
                className="group flex flex-col gap-2 rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.title}</span>
                <span className="text-sm text-muted-foreground">{c.desc}</span>
              </Link>
            ) : (
              <div
                key={c.slug}
                className="relative flex flex-col gap-2 rounded-lg border border-border p-5 opacity-50 cursor-default"
              >
                <Badge variant="secondary" className="absolute top-3 right-3 text-xs">Скоро</Badge>
                <span className="text-3xl grayscale">{c.emoji}</span>
                <span className="font-semibold text-foreground">{c.title}</span>
                <span className="text-sm text-muted-foreground">{c.desc}</span>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
