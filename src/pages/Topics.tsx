import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Topics() {
  const { data: topics, isLoading } = useQuery({
    queryKey: ['public-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('document_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageSEO
        title="Темы"
        description="Каталог правовых тем: налоги, трудовое право, договоры, бухучёт и другие отрасли законодательства РБ."
        path="/topics"
      />
      <section className="mx-auto max-w-6xl px-4 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Темы</h1>
        </div>
        <p className="text-muted-foreground mb-8">Навигация по отраслям законодательства Республики Беларусь</p>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-5 w-1/2 mb-3" /><Skeleton className="h-4 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics?.map((topic) => (
              <Link key={topic.id} to={`/topics/${topic.slug}`}>
                <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
                    )}
                    <span className="text-xs font-medium text-primary">{topic.document_count} материалов →</span>
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
