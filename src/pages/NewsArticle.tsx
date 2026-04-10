import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, experts(name, specialty)')
        .eq('slug', slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const audienceLabel = (a: string) => {
    if (a === 'accountant') return 'Бухгалтер';
    if (a === 'lawyer') return 'Юрист';
    return 'Общее';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Статья не найдена</h1>
        <Button asChild variant="outline">
          <Link to="/news">Вернуться к новостям</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={article.title}
        description={article.excerpt || `Статья: ${article.title}`}
        path={`/news/${slug}`}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Все новости
          </Link>
        </Button>

        <Badge variant="outline" className="mb-3">{audienceLabel(article.audience)}</Badge>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">
          {article.experts && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {(article.experts as any).name}
              {(article.experts as any).specialty && (
                <span className="text-xs">· {(article.experts as any).specialty}</span>
              )}
            </span>
          )}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(article.published_at)}</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{article.views.toLocaleString()}</span>
        </div>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary/30 pl-4">{article.excerpt}</p>
        )}

        <div className="prose prose-sm max-w-none">
          {article.body?.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace('### ', '')}</h3>;
            if (line.startsWith('- ')) return <li key={i} className="text-muted-foreground ml-4 mb-1">{line.replace('- ', '')}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-muted-foreground leading-relaxed mb-3">{line}</p>;
          })}
        </div>
      </article>
    </>
  );
}
