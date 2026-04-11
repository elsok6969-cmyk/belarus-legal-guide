import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingTimeout } from '@/components/shared/LoadingTimeout';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const TOPIC_FILTERS = [
  { label: 'Все', slug: '' },
  { label: 'Налоги', slug: 'taxes' },
  { label: 'Трудовое право', slug: 'labor' },
  { label: 'Бухучёт', slug: 'accounting' },
];

const TOPIC_COLORS: Record<string, string> = {
  taxes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  labor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accounting: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  contracts: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function News() {
  const [activeFilter, setActiveFilter] = useState('');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['public-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, body, views, published_at, audience, experts(name)')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch article_topics for all articles
  const articleIds = articles?.map(a => a.id) || [];
  const { data: articleTopics } = useQuery({
    queryKey: ['article-topics', articleIds],
    queryFn: async () => {
      if (articleIds.length === 0) return [];
      const { data } = await supabase
        .from('article_topics')
        .select('article_id, topics(name, slug)')
        .in('article_id', articleIds);
      return data || [];
    },
    enabled: articleIds.length > 0,
  });

  const topicsMap = new Map<string, { name: string; slug: string }[]>();
  articleTopics?.forEach((at: any) => {
    const t = at.topics;
    if (!t) return;
    const list = topicsMap.get(at.article_id) || [];
    list.push({ name: t.name, slug: t.slug });
    topicsMap.set(at.article_id, list);
  });

  const filtered = activeFilter
    ? articles?.filter(a => {
        const topics = topicsMap.get(a.id);
        return topics?.some(t => t.slug === activeFilter);
      })
    : articles;

  const getExcerpt = (article: any) => {
    if (article.excerpt) return article.excerpt;
    if (article.body) return article.body.replace(/[#*_\[\]]/g, '').substring(0, 160);
    return '';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO
        title="Новости законодательства Беларуси | Бабиджон"
        description="Обзоры изменений в НПА, разъяснения, новые законы и указы."
        path="/news"
        breadcrumbs={[{ name: 'Главная', path: '/' }, { name: 'Новости', path: '/news' }]}
      />

      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Новости' }]} />

      <div className="flex items-center gap-3 mb-1 mt-4">
        <Newspaper className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Новости законодательства</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Изменения в НПА, обзоры, разъяснения</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TOPIC_FILTERS.map(f => (
          <Button
            key={f.slug}
            variant={activeFilter === f.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(f.slug)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      <LoadingTimeout isLoading={isLoading} skeletonCount={5} skeletonClassName="h-24 w-full">
        {filtered && filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map(article => {
              const topics = topicsMap.get(article.id) || [];
              const excerpt = getExcerpt(article);
              return (
                <Link
                  key={article.id}
                  to={`/news/${article.slug}`}
                  className="block py-4 first:pt-0 group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.published_at
                        ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: ru })
                        : ''}
                    </span>
                    {topics.map(t => (
                      <Badge
                        key={t.slug}
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${TOPIC_COLORS[t.slug] || ''}`}
                      >
                        {t.name}
                      </Badge>
                    ))}
                    {topics.length === 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Общее</Badge>
                    )}
                  </div>
                  <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  {excerpt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{excerpt}</p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            {activeFilter ? 'Нет новостей по выбранной теме' : 'Новости пока не опубликованы'}
          </p>
        )}
      </LoadingTimeout>
    </div>
  );
}
