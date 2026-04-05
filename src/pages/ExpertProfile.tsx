import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';

export default function ExpertProfile() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageSEO
        title="Профиль эксперта — Право БY"
        description="Профиль эксперта и список публикаций на платформе Право БY."
      />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/experts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Все эксперты
          </Link>
        </Button>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">ЭК</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">Эксперт #{id}</CardTitle>
              <p className="text-sm text-muted-foreground">Специализация — заглушка</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Биография и описание будут загружены из базы данных.</p>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4">Публикации</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Статья-заглушка #{i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Содержание будет загружено из базы данных.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
