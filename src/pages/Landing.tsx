import { Link } from 'react-router-dom';
import { Search, FileText, Bot, Shield, Monitor, Smartphone, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(215_80%_55%/0.4),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/90">
          <Scale className="h-4 w-4" />
          Платформа правовой информации
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
          Вся правовая информация Беларуси — в одном удобном интерфейсе
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
          Современная платформа для поиска и работы с нормативными правовыми актами Республики Беларусь. 
          Быстрый поиск, структурированный просмотр и AI&#8209;ассистент со ссылками на первоисточники.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="secondary" className="text-base px-8">
            <Link to="/app">
              Начать работу
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function WhatIsSection() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Что такое Право&nbsp;БY?</h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Право&nbsp;БY — платформа для поиска и работы с нормативными правовыми актами 
          Республики Беларусь. Современный интерфейс и умный поиск помогают быстрее 
          находить нужные документы. AI&#8209;ассистент отвечает на вопросы со ссылками 
          на первоисточники, но не заменяет юридическую консультацию.
        </p>
      </div>
    </section>
  );
}

const audiences = [
  { title: 'Юристы', desc: 'Быстрый доступ к актуальным редакциям НПА и навигация по связанным документам.' },
  { title: 'Бухгалтеры', desc: 'Поиск по налоговому и трудовому законодательству в удобном формате.' },
  { title: 'Предприниматели', desc: 'Ответы на типичные правовые вопросы без необходимости изучать десятки документов.' },
  { title: 'Студенты юрфаков', desc: 'Инструмент для учёбы: поиск норм, чтение комментариев, проверка знаний.' },
  { title: 'Госслужащие', desc: 'Оперативный поиск нормативной базы для ежедневной работы.' },
];

function AudienceSection() {
  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Для кого</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <Card key={a.title} className="border-0 bg-card shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Search, title: 'Полнотекстовый поиск', desc: 'Находите нужные документы и нормы за секунды по ключевым словам, номерам и датам.' },
  { icon: FileText, title: 'Структурированный просмотр', desc: 'Читайте документы в удобном формате с навигацией по статьям, главам и разделам.' },
  { icon: Bot, title: 'AI-ассистент с цитатами', desc: 'Задайте вопрос — получите ответ со ссылками на конкретные нормы и статьи.' },
  { icon: Monitor, title: 'Современный интерфейс', desc: 'Интуитивный дизайн, тёмная тема, адаптация под любое устройство.' },
];

function FeaturesSection() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Возможности</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="border bg-card">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const aiCan = [
  'Ищет релевантные нормы по вашему запросу',
  'Объясняет сложные формулировки простым языком',
  'Даёт ссылки на конкретные статьи и документы',
  'Помогает сориентироваться в большом объёме информации',
];

const aiCannot = [
  'Не даёт юридических консультаций',
  'Не гарантирует полноту и точность ответов',
  'Не заменяет квалифицированного специалиста',
  'Не несёт ответственности за принятые решения',
];

function AISection() {
  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">AI: возможности и ограничения</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Мы стремимся к прозрачности. Вот что AI-ассистент умеет — и чего от него ожидать не стоит.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="border-0 bg-card">
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Что AI делает
              </h3>
              <ul className="mt-4 space-y-3">
                {aiCan.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
                <XCircle className="h-5 w-5" />
                Чего AI не делает
              </h3>
              <ul className="mt-4 space-y-3">
                {aiCannot.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-lg border border-warning/30 bg-warning/5 p-4 text-center text-sm text-muted-foreground">
          <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-warning" />
          Ответы AI носят исключительно информационный характер и не являются юридической консультацией. 
          Всегда проверяйте информацию по первоисточникам.
        </div>
      </div>
    </section>
  );
}

const advantages = [
  { icon: Monitor, title: 'Современный UX', desc: 'Простой и понятный интерфейс без перегруженности.' },
  { icon: Search, title: 'Быстрый поиск', desc: 'Результаты за доли секунды, даже в большом объёме данных.' },
  { icon: Smartphone, title: 'Доступ с любого устройства', desc: 'Работайте с ноутбука, планшета или телефона.' },
  { icon: Shield, title: 'Прозрачная работа AI', desc: 'Всегда видно источники — никаких «чёрных ящиков».' },
];

function AdvantagesSection() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Почему удобнее</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a) => (
            <div key={a.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <a.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-primary px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
          Попробуйте прямо сейчас
        </h2>
        <p className="mt-4 text-primary-foreground/80">
          Зарегистрируйтесь и начните работать с правовой информацией в удобном формате.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-8 text-base px-8">
          <Link to="/app">
            Начать работу
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div>
            <span className="text-lg font-bold">Право&nbsp;БY</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Платформа правовой информации Республики Беларусь
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/app" className="hover:text-foreground transition-colors">Войти</Link>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Право БY. Платформа не оказывает юридических услуг и не несёт
            ответственности за решения, принятые на основе предоставленной информации.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <WhatIsSection />
      <AudienceSection />
      <FeaturesSection />
      <AISection />
      <AdvantagesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
