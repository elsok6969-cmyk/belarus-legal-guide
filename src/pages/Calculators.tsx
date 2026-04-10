import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/shared/PageSEO';
import {
  Search, Calculator, Percent, Palmtree, AlertTriangle,
  Receipt, Briefcase, Heart, Stethoscope, Plane, Building2,
} from 'lucide-react';

interface CalcItem {
  slug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const calculators: CalcItem[] = [
  {
    slug: 'income-tax',
    title: 'Подоходный налог',
    description: 'Расчёт подоходного налога с учётом вычетов',
    icon: <Percent className="h-6 w-6" />,
    category: 'Налоги',
  },
  {
    slug: 'vat',
    title: 'Калькулятор НДС',
    description: 'Выделить или начислить НДС на сумму',
    icon: <Receipt className="h-6 w-6" />,
    category: 'Налоги',
  },
  {
    slug: 'tax-penalty',
    title: 'Пеня по налогам',
    description: 'Расчёт пени за просрочку уплаты налога',
    icon: <AlertTriangle className="h-6 w-6" />,
    category: 'Налоги',
  },
  {
    slug: 'vacation-pay',
    title: 'Расчёт отпускных',
    description: 'Средний заработок и сумма отпускных',
    icon: <Palmtree className="h-6 w-6" />,
    category: 'Зарплата',
  },
  {
    slug: 'work-experience',
    title: 'Трудовой стаж',
    description: 'Подсчёт общего трудового стажа по периодам',
    icon: <Briefcase className="h-6 w-6" />,
    category: 'Трудовые отношения',
  },
  {
    slug: 'alimony',
    title: 'Калькулятор алиментов',
    description: 'Расчёт алиментов на детей по ст. 92 КоБС',
    icon: <Heart className="h-6 w-6" />,
    category: 'Семейное право',
  },
  {
    slug: 'sick-leave',
    title: 'Больничный лист',
    description: 'Расчёт пособия по временной нетрудоспособности',
    icon: <Stethoscope className="h-6 w-6" />,
    category: 'Зарплата',
  },
  {
    slug: 'business-trip',
    title: 'Командировочные',
    description: 'Суточные и аванс для командировки',
    icon: <Plane className="h-6 w-6" />,
    category: 'Зарплата',
  },
  {
    slug: 'rent',
    title: 'Арендная плата',
    description: 'Расчёт аренды по базовой арендной величине',
    icon: <Building2 className="h-6 w-6" />,
    category: 'Недвижимость',
  },
];

const categories = ['Налоги', 'Зарплата', 'Трудовые отношения', 'Семейное право', 'Недвижимость'];

export default function Calculators() {
  const [filter, setFilter] = useState('');

  const filtered = calculators.filter(
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
            {calculators.length} калькуляторов для профессиональной работы
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

        {categories.map((cat) => {
          const items = filtered.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((calc) => (
                  <Link key={calc.slug} to={`/app/calculator/${calc.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-5 flex gap-4 items-start">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          {calc.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{calc.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{calc.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">{calc.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
