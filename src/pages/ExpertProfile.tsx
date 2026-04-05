import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ExpertProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: expert, isLoading: loadingExpert } = useQuery({
    queryKey: ['expert', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['expert-articles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, views, published_at')
        .eq('expert_id', id!)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <>
      <PageSEO
        title={expert ? expert.name : 'Эксперт'}
        description={expert?.bio || 'Профиль эксперта.'}
        path={`/experts/${id}`}
      />
      <section className="mx-auto max-w-3xl px-4 lg:px-8 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/experts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Все эксперты
          </Link>
        </Button>

        {loadingExpert ? (
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : expert ? (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center gap-5">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {expert.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{expert.name}</CardTitle>
                {expert.specialty && (
                  <p className="text-sm text-muted-foreground mt-1">{expert.specialty}</p>
                )}
                <Badge variant="secondary" className="mt-2 text-xs">{expert.article_count} статей</Badge>
              </div>
            </CardHeader>
            {expert.bio && (
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{expert.bio}</p>
              </CardContent>
            )}
          </Card>
        ) : (
          <p className="text-center text-muted-foreground py-12">Эксперт не найден.</p>
        )}

        <h2 className="text-lg font-semibold mb-4">Публикации</h2>

        {loadingArticles ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
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
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(article.published_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">Публикаций пока нет.</p>
        )}
      </section>
    </>
  );
}
