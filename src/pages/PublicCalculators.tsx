import { Link } from 'react-router-dom';
import { PageSEO } from '@/components/shared/PageSEO';
import { allCalculators } from '@/lib/calculatorsList';

export default function PublicCalculators() {
  return (
    <>
      <PageSEO
        title="Онлайн калькуляторы для бухгалтера РБ | Бабиджон"
        description="10 калькуляторов: НДС, подоходный, пени, отпускные, алименты, больничный, стаж."
        path="/calculator"
        breadcrumbs={[{ name: 'Главная', path: '/' }, { name: 'Калькуляторы', path: '/calculator' }]}
      />
      <div className="container max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Калькуляторы</h1>
          <p className="text-muted-foreground mt-1">{allCalculators.length} онлайн-расчётов для бухгалтеров и предпринимателей</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCalculators.map((c) => (
            <Link
              key={c.slug}
              to={`/calculator/${c.slug}`}
              className="group flex items-start gap-3 rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
            >
              <span className="text-2xl shrink-0">{c.emoji}</span>
              <div className="min-w-0">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors block">{c.title}</span>
                <span className="text-sm text-muted-foreground">{c.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
