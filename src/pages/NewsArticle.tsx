import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const TOPIC_COLORS: Record<string, string> = {
  taxes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  labor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accounting: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  contracts: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

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

  // Topics for this article
  const { data: topics } = useQuery({
    queryKey: ['article-topics', article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('article_topics')
        .select('topics(name, slug)')
        .eq('article_id', article!.id);
      return (data || []).map((d: any) => d.topics).filter(Boolean);
    },
    enabled: !!article?.id,
  });

  // Related articles (latest 3 excluding current)
  const { data: relatedArticles } = useQuery({
    queryKey: ['related-articles', article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at')
        .not('published_at', 'is', null)
        .neq('id', article!.id)
        .order('published_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!article?.id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-6 w-48 mb-6" />
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

  const expert = article.experts as any;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageSEO
        title={article.title}
        description={article.excerpt || `Статья: ${article.title}`}
        path={`/news/${slug}`}
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Новости', href: '/news' },
        { label: article.title.length > 40 ? article.title.substring(0, 40) + '…' : article.title },
      ]} />

      <Button asChild variant="ghost" size="sm" className="mb-4 mt-2 -ml-2">
        <Link to="/news">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Все новости
        </Link>
      </Button>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {topics && topics.length > 0 ? topics.map((t: any) => (
          <Badge key={t.slug} variant="secondary" className={`text-xs ${TOPIC_COLORS[t.slug] || ''}`}>
            {t.name}
          </Badge>
        )) : (
          <Badge variant="secondary" className="text-xs">Общее</Badge>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{article.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">
        {expert?.name && (
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {expert.name}
            {expert.specialty && <span className="text-xs">· {expert.specialty}</span>}
          </span>
        )}
        {article.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(article.published_at), 'd MMMM yyyy', { locale: ru })}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />{article.views.toLocaleString()}
        </span>
      </div>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary/30 pl-4">
          {article.excerpt}
        </p>
      )}

      {/* Body — Markdown */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-12">
        {article.body ? (
          <ReactMarkdown>{article.body}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground italic">Содержание статьи пока недоступно.</p>
        )}
      </div>

      {/* Related articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="border-t pt-8 mb-8">
          <h2 className="text-lg font-bold mb-4">Другие новости</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {relatedArticles.map(ra => (
              <Link key={ra.id} to={`/news/${ra.slug}`} className="group">
                <Card className="h-full">
                  <CardContent className="p-4">
                    {ra.published_at && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {format(new Date(ra.published_at), 'd MMM yyyy', { locale: ru })}
                      </p>
                    )}
                    <p className="text-sm font-medium leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                      {ra.title}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold mb-2">Полный доступ к документам</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Оформите подписку для неограниченного доступа к базе НПА, AI-ассистенту и аналитике
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link to="/pricing">Тарифы</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth">Регистрация</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
