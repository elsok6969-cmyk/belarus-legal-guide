import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';

export default function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <PageSEO
        title={`Тема: ${slug}`}
        description={`Статьи и документы по теме «${slug}» в законодательстве Республики Беларусь.`}
        path={`/topics/${slug}`}
      />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/topics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Все темы
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Tag className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight capitalize">{slug?.replace(/-/g, ' ')}</h1>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Статья-заглушка #{i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Содержание будет загружено из базы данных.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
