import { Link, useLocation } from 'react-router-dom';
import { allCalculators } from '@/lib/calculatorsList';

interface Props {
  currentSlug: string;
}

export function OtherCalculators({ currentSlug }: Props) {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app/');
  const prefix = isApp ? '/app/calculator' : '/calculator';
  const others = allCalculators.filter((c) => c.slug !== currentSlug);

  return (
    <div className="border-t border-border pt-6 mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-3">Другие калькуляторы</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {others.map((c) => (
          <Link
            key={c.slug}
            to={`${prefix}/${c.slug}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
          >
            <span>{c.emoji}</span>
            <span className="text-foreground hover:text-primary">{c.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
