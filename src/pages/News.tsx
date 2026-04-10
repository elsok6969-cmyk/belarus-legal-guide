import { Newspaper, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/shared/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  views: number;
  published_at: string | null;
  audience: string;
  experts: { name: string } | null;
};

export default function News() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['public-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, views, published_at, audience, experts(name)')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Article[];
    },
  });

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const audienceLabel = (a: string) => {
    if (a === 'accountant') return 'Бухгалтер';
    if (a === 'lawyer') return 'Юрист';
    return 'Общее';
  };

  return (
    <>
      <PageSEO
        title="Новости и аналитика"
        description="Актуальные новости законодательства Республики Беларусь, экспертные обзоры и аналитические материалы."
        path="/news"
      />
      <section className="mx-auto max-w-6xl px-4 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Новости и аналитика</h1>
        </div>
        <p className="text-muted-foreground mb-8">Экспертные материалы по законодательству Республики Беларусь</p>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-3/4 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articles?.map((article) => (
              <Link key={article.id} to={`/news/${article.slug}`}>
                <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs font-normal">{audienceLabel(article.audience)}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(article.published_at)}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-snug mt-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {article.experts?.name && <span>{article.experts.name}</span>}
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
