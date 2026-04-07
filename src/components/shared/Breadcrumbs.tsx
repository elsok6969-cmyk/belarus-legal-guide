import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="flex items-center gap-1 text-[13px] mb-4 flex-wrap" style={{ color: 'hsl(var(--gray-400))' }}>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span>›</span>}
          {item.href ? (
            <Link to={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium" style={{ color: 'hsl(var(--gray-900))' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
