import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/shared/PageSEO';
import { Search } from 'lucide-react';
import { allCalculators } from '@/lib/calculatorsList';

export default function Calculators() {
  const [filter, setFilter] = useState('');

  const filtered = allCalculators.filter(
    (c) =>
      c.title.toLowerCase().includes(filter.toLowerCase()) ||
      c.description.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <PageSEO title="Калькуляторы — Бабиджон" description="Профессиональные калькуляторы для бухгалтеров и юристов" path="/app/calculator" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Калькуляторы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allCalculators.length} калькуляторов для профессиональной работы
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск калькулятора..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((calc) => (
            <Link key={calc.slug} to={`/app/calculator/${calc.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">{calc.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{calc.title}</p>
                    <p className="text-sm text-muted-foreground">{calc.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Ничего не найдено</p>
        )}
      </div>
    </>
  );
}
