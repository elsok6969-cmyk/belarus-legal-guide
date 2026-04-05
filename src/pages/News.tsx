import { Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/shared/PageSEO';

const placeholderArticles = [
  { slug: 'tax-changes-2026', title: 'Изменения в налоговом законодательстве 2026', topic: 'Налоги', date: '04.04.2026', views: 1245 },
  { slug: 'labor-code-update', title: 'Обновления Трудового кодекса: что нужно знать', topic: 'Трудовое право', date: '03.04.2026', views: 892 },
  { slug: 'contract-law-changes', title: 'Договорная работа: новые правила оформления', topic: 'Договоры', date: '02.04.2026', views: 567 },
  { slug: 'vat-q1-2026', title: 'Заполнение декларации по НДС за I квартал 2026', topic: 'НДС', date: '01.04.2026', views: 2341 },
];

export default function News() {
  return (
    <>
      <PageSEO
        title="Новости и аналитика"
        description="Актуальные новости законодательства Республики Беларусь, экспертные обзоры и аналитические материалы."
        path="/news"
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Новости и аналитика</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {placeholderArticles.map((article) => (
            <Link key={article.slug} to={`/news/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{article.topic}</Badge>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <CardTitle className="text-lg leading-snug mt-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Содержание статьи будет загружено из базы данных.
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">{article.views} просмотров</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
