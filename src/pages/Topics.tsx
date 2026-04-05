import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/shared/PageSEO';

const placeholderTopics = [
  { slug: 'taxes', name: 'Налоги', count: 342, description: 'НДС, налог на прибыль, подоходный налог, УСН' },
  { slug: 'labor', name: 'Трудовое право', count: 218, description: 'Трудовые договоры, зарплата, отпуска, увольнение' },
  { slug: 'contracts', name: 'Договорная работа', count: 156, description: 'Заключение, изменение и расторжение договоров' },
  { slug: 'accounting', name: 'Бухгалтерский учёт', count: 289, description: 'Отчётность, проводки, инвентаризация, амортизация' },
  { slug: 'real-estate', name: 'Недвижимость', count: 97, description: 'Купля-продажа, аренда, регистрация' },
  { slug: 'corporate', name: 'Корпоративное право', count: 134, description: 'Создание и ликвидация юрлиц, учредительные документы' },
];

export default function Topics() {
  return (
    <>
      <PageSEO
        title="Темы"
        description="Каталог правовых тем: налоги, трудовое право, договоры, бухучёт и другие отрасли законодательства РБ."
        path="/topics"
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Tag className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Темы</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderTopics.map((topic) => (
            <Link key={topic.slug} to={`/topics/${topic.slug}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
                  <span className="text-xs text-muted-foreground">{topic.count} материалов</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
