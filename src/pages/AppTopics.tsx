import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const topics = [
  { slug: 'taxes', name: 'Налоги', count: 342 },
  { slug: 'labor', name: 'Трудовое право', count: 218 },
  { slug: 'contracts', name: 'Договоры', count: 156 },
  { slug: 'accounting', name: 'Бухучёт', count: 289 },
  { slug: 'real-estate', name: 'Недвижимость', count: 97 },
  { slug: 'corporate', name: 'Корпоративное', count: 134 },
];

export default function AppTopics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Темы</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <Link key={t.slug} to={`/app/documents?topic=${t.slug}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">{t.count} документов</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
