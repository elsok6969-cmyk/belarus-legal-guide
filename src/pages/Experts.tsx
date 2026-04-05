import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Experts() {
  const { data: experts, isLoading } = useQuery({
    queryKey: ['public-experts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .order('article_count', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageSEO
        title="Эксперты"
        description="Наши эксперты: юристы, бухгалтеры и специалисты по законодательству Республики Беларусь."
        path="/experts"
      />
      <section className="mx-auto max-w-6xl px-4 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Эксперты</h1>
        </div>
        <p className="text-muted-foreground mb-8">Авторы экспертных материалов на платформе</p>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-4 w-24" /></div></div></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experts?.map((expert) => (
              <Link key={expert.id} to={`/experts/${expert.id}`}>
                <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {expert.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{expert.name}</CardTitle>
                      {expert.specialty && (
                        <p className="text-xs text-muted-foreground mt-0.5">{expert.specialty}</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {expert.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{expert.bio}</p>
                    )}
                    <Badge variant="secondary" className="text-xs">{expert.article_count} статей</Badge>
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
