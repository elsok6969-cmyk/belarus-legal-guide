import { Link } from 'react-router-dom';
import { Search, Bot, FileText, Bell, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DisclaimerFull } from '@/components/shared/Disclaimers';
import { PageSEO } from '@/components/shared/PageSEO';

const steps = [
  { num: '1', icon: Search, title: 'Поиск', desc: 'Введите ключевые слова, номер или дату документа. Система найдёт релевантные нормативные акты и ранжирует результаты.' },
  { num: '2', icon: FileText, title: 'Просмотр', desc: 'Читайте документы в структурированном виде — с навигацией по статьям, главам и разделам. Переходите к связанным актам.' },
  { num: '3', icon: Bot, title: 'AI-ассистент', desc: 'Задайте вопрос на обычном языке. AI найдёт релевантные нормы в базе и сформирует ответ со ссылками на первоисточники.' },
  { num: '4', icon: Bell, title: 'Мониторинг', desc: 'Подпишитесь на интересующие документы. Получайте уведомления, когда в них вносятся изменения или поправки.' },
];

const aiCan = [
  'Находит релевантные фрагменты в базе НПА',
  'Объясняет сложные формулировки простым языком',
  'Прикрепляет ссылки на конкретные статьи',
];

const aiCannot = [
  'Не даёт юридических консультаций',
  'Не гарантирует полноту ответов',
  'Не заменяет квалифицированного юриста',
];

export default function HowItWorks() {
  return (
    <div>
      <PageSEO title="Как это работает" description="Узнайте, как платформа Право БY помогает искать, читать и отслеживать изменения в законодательстве Беларуси." path="/how-it-works" />
      <section className="bg-primary px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">Как это работает</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Четыре шага от вопроса до ответа со ссылкой на источник.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl grid gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.num}
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <s.icon className="h-5 w-5 text-primary" />
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-center">AI-ассистент: что он делает и чего не делает</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="border-0 bg-card">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  Делает
                </h3>
                <ul className="mt-4 space-y-2">
                  {aiCan.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-destructive">
                  <XCircle className="h-5 w-5" />
                  Не делает
                </h3>
                <ul className="mt-4 space-y-2">
                  {aiCannot.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <DisclaimerFull className="mt-8" />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">Попробуйте сами</h2>
          <p className="mt-3 text-muted-foreground">
            Зарегистрируйтесь и начните поиск по базе НПА уже сейчас.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/register">
              Начать работу
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
