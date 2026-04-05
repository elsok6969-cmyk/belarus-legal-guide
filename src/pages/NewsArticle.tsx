import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <PageSEO
        title="Статья"
        description="Экспертная статья по законодательству Республики Беларусь."
        path={`/news/${slug}`}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к новостям
          </Link>
        </Button>

        <Badge variant="secondary" className="mb-3">Тема</Badge>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Заголовок статьи: {slug}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> Эксперт</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> 04.04.2026</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> 1 245</span>
        </div>

        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>Содержание статьи будет загружено из базы данных. Это заглушка.</p>
          <p>Здесь будет полный текст экспертного материала с перекрёстными ссылками на нормативные акты.</p>
        </div>
      </article>
    </>
  );
}
