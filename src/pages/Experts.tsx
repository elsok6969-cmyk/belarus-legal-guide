import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageSEO } from '@/components/shared/PageSEO';

const placeholderExperts = [
  { id: '1', name: 'Ирина Статкевич', specialty: 'Зарплата, подоходный налог', articles: 87 },
  { id: '2', name: 'Валерий Хлебовец', specialty: 'НДС', articles: 64 },
  { id: '3', name: 'Максим Мазалевский', specialty: 'УСН и другие налоги', articles: 45 },
  { id: '4', name: 'Оксана Пимошенко', specialty: 'Налог на прибыль', articles: 52 },
  { id: '5', name: 'Елена Филиппова', specialty: 'Отчётность ФСЗН', articles: 38 },
  { id: '6', name: 'Сергей Белявский', specialty: 'Договорная работа', articles: 71 },
];

export default function Experts() {
  return (
    <>
      <PageSEO
        title="Эксперты"
        description="Наши эксперты: юристы, бухгалтеры и специалисты по законодательству Республики Беларусь."
        path="/experts"
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Эксперты</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderExperts.map((expert) => (
            <Link key={expert.id} to={`/experts/${expert.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {expert.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{expert.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{expert.specialty}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">{expert.articles} статей</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
