import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, Bot, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const values = [
  { icon: FileText, title: 'Доступность', desc: 'Правовая информация должна быть доступна каждому, а не только юристам. Мы делаем законодательство понятнее.' },
  { icon: Shield, title: 'Прозрачность', desc: 'Каждый ответ содержит ссылки на первоисточники. Мы открыто сообщаем об ограничениях платформы и AI.' },
  { icon: Bot, title: 'Технологии с ответственностью', desc: 'AI помогает ориентироваться в нормах, но не заменяет юриста. Мы всегда это подчёркиваем.' },
  { icon: Users, title: 'Для бизнеса и людей', desc: 'Платформа создана для предпринимателей, бухгалтеров и всех, кто работает с законодательством.' },
];

export default function About() {
  return (
    <div>
      <section className="bg-primary px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">О платформе</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Право&nbsp;БY — это инструмент для работы с нормативными правовыми актами 
            Республики Беларусь. Современный интерфейс, умный поиск и AI-ассистент 
            помогают быстрее находить и понимать нужные нормы.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-center">Наши принципы</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} className="border bg-card">
                <CardContent className="p-6">
                  <v.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">Начните работу</h2>
          <p className="mt-3 text-muted-foreground">
            Зарегистрируйтесь и получите доступ ко всем возможностям платформы.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/register">
              Попробовать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
