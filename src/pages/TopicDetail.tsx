import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: topic, isLoading: loadingTopic } = useQuery({
    queryKey: ['topic', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('slug', slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['topic-articles', topic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_topics')
        .select('articles(id, title, slug, excerpt, views, published_at, experts(name))')
        .eq('topic_id', topic!.id);
      if (error) throw error;
      return data.map((d: any) => d.articles).filter(Boolean);
    },
    enabled: !!topic?.id,
  });

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <>
      <PageSEO
        title={topic ? topic.name : 'Тема'}
        description={topic?.description || `Материалы по теме в законодательстве Республики Беларусь.`}
        path={`/topics/${slug}`}
      />
      <section className="mx-auto max-w-4xl px-4 lg:px-8 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/topics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Все темы
          </Link>
        </Button>

        {loadingTopic ? (
          <Skeleton className="h-10 w-1/2 mb-4" />
        ) : topic ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{topic.name}</h1>
            </div>
            {topic.description && (
              <p className="text-muted-foreground mb-8">{topic.description}</p>
            )}
          </>
        ) : (
          <h1 className="text-2xl font-bold mb-4">Тема не найдена</h1>
        )}

        <h2 className="text-lg font-semibold mb-4">Статьи по теме</h2>

        {loadingArticles ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article: any) => (
              <Link key={article.id} to={`/news/${article.slug}`}>
                <Card className="hover:shadow-md transition-all mb-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {article.experts?.name && <span>{article.experts.name}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(article.published_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">Статей по этой теме пока нет.</p>
        )}
      </section>
    </>
  );
}
