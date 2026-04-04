import { Link } from 'react-router-dom';
import {
  Search, FileText, Bot, Shield, RefreshCw, ArrowRight,
  CheckCircle2, XCircle, Scale, Eye,
  Building2, ShoppingCart, BookOpen, Briefcase, Users,
  Clock, Link2, History, ExternalLink,
} from 'lucide-react';
import { DisclaimerFull } from '@/components/shared/Disclaimers';
import { PageSEO } from '@/components/shared/PageSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/* ──────────────────────────────────────────────
   1. Hero
   ────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(215_80%_55%/0.4),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/90">
          <Scale className="h-4 w-4" />
          Платформа правовой информации
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
          Законодательство Беларуси в понятном формате
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
          Поиск, чтение и отслеживание изменений в нормативных правовых актах.
          AI&#8209;ассистент объясняет нормы простым языком и ссылается на первоисточники.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="secondary" className="text-base px-8">
            <Link to="/app">
              Попробовать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 text-base">
            <Link to="#what">
              Узнать подробнее
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   2. What this platform does
   ────────────────────────────────────────────── */

const capabilities = [
  {
    icon: Search,
    title: 'Полнотекстовый поиск',
    desc: 'Находите нужные нормы по ключевым словам, номерам документов или датам принятия. Результаты ранжируются по релевантности.',
  },
  {
    icon: FileText,
    title: 'Структурированный просмотр',
    desc: 'Документы разбиты на статьи, главы и разделы. Навигация позволяет быстро переходить к нужному фрагменту.',
  },
  {
    icon: RefreshCw,
    title: 'Актуальные редакции',
    desc: 'Платформа отслеживает изменения и обновляет тексты документов. Вы работаете с актуальной версией.',
  },
  {
    icon: Bot,
    title: 'Пояснения на понятном языке',
    desc: 'AI&#8209;ассистент объясняет сложные формулировки и помогает найти связанные нормы. Каждый ответ содержит ссылки на источники.',
  },
  {
    icon: Eye,
    title: 'Мониторинг изменений',
    desc: 'Подписывайтесь на интересующие документы и получайте уведомления о внесённых поправках.',
  },
  {
    icon: History,
    title: 'История редакций',
    desc: 'Сравнивайте версии документа. Видно, что именно изменилось, когда и каким актом.',
  },
];

function WhatSection() {
  return (
    <section id="what" className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Что делает платформа</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Право&nbsp;БY — это инструмент для работы с правовой информацией. 
          Ниже — конкретные функции, доступные каждому пользователю.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.title} className="border bg-card">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <c.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: c.desc }} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   3. AI assistant — how it works
   ────────────────────────────────────────────── */

const aiDoes = [
  'Принимает ваш вопрос и ищет релевантные фрагменты в базе НПА',
  'Формирует ответ на основе найденных норм, а не «общих знаний»',
  'Прикрепляет ссылки на конкретные статьи и документы',
  'Объясняет сложные формулировки простым языком',
  'Показывает, из каких источников взята информация',
];

const aiDoesNot = [
  'Не даёт юридических консультаций и правовых заключений',
  'Не гарантирует полноту и абсолютную точность ответов',
  'Не заменяет квалифицированного юриста',
  'Не формирует правовую позицию для суда',
  'Не несёт ответственности за решения, принятые на основе ответов',
];

function AISection() {
  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">AI-ассистент: как это работает</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Ассистент работает по принципу «поиск + объяснение». Он не генерирует ответы 
          из «общих знаний» — вместо этого находит конкретные нормы в базе документов 
          и формулирует ответ на их основе.
        </p>

        <div className="mx-auto mt-8 max-w-3xl rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Как устроен процесс</h3>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</span>
              <span>Вы задаёте вопрос на естественном языке — например, «Какие налоги платит ИП на упрощённой системе?»</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</span>
              <span>Система находит в базе НПА фрагменты, наиболее релевантные вашему вопросу</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">3</span>
              <span>AI формирует ответ на основе найденных фрагментов и прикрепляет ссылки на первоисточники</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">4</span>
              <span>Вы можете перейти к оригиналу документа и проверить информацию самостоятельно</span>
            </li>
          </ol>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-0 bg-card">
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Что AI делает
              </h3>
              <ul className="mt-4 space-y-3">
                {aiDoes.map((item) => (
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
                {aiDoesNot.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <DisclaimerFull className="mt-8" />
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   4. Automatic updates & monitoring
   ────────────────────────────────────────────── */

function UpdatesSection() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Обновления и мониторинг</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Законодательство меняется регулярно. Платформа помогает не пропустить важные изменения.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <RefreshCw className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Регулярные проверки</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Система периодически проверяет официальные источники на наличие новых документов и поправок.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Clock className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Уведомления об изменениях</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Подпишитесь на документ — получайте уведомления, когда в него вносятся поправки или он утрачивает силу.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <History className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Сравнение редакций</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Видно, что именно изменилось в документе: добавленные, удалённые и изменённые фрагменты.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Это снижает риск работы с устаревшей информацией, но не исключает его полностью.
          Рекомендуем сверяться с официальными публикациями.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   5. Who this product is for / NOT for
   ────────────────────────────────────────────── */

const forWhom = [
  { icon: Briefcase, title: 'Предприниматели и ИП', desc: 'Ответы на типичные вопросы: регистрация, налоги, отчётность, лицензирование.' },
  { icon: Building2, title: 'Малый и средний бизнес', desc: 'Отслеживание изменений в трудовом, налоговом и хозяйственном законодательстве.' },
  { icon: ShoppingCart, title: 'Интернет-магазины и оптовики', desc: 'Правила торговли, маркировка, защита прав потребителей, таможенное регулирование.' },
  { icon: Users, title: 'Сотрудники без юридического образования', desc: 'HR-специалисты, бухгалтеры, руководители — все, кому нужно разобраться в нормах.' },
  { icon: BookOpen, title: 'Студенты', desc: 'Учебный инструмент для поиска и изучения нормативных правовых актов.' },
];

const notFor = [
  'Подготовка правовых позиций для судебных разбирательств',
  'Получение юридических заключений и консультаций',
  'Замена профессиональной юридической помощи в сложных ситуациях',
  'Работа с конфиденциальными или закрытыми правовыми актами',
];

function AudienceSection() {
  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Для кого эта платформа</h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forWhom.map((a) => (
            <Card key={a.title} className="border-0 bg-card shadow-sm">
              <CardContent className="p-6">
                <a.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 mx-auto max-w-2xl">
          <h3 className="text-center text-lg font-semibold">Для чего платформа не предназначена</h3>
          <ul className="mt-6 space-y-3">
            {notFor.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   6. Trust & transparency
   ────────────────────────────────────────────── */

const trustPoints = [
  { icon: ExternalLink, title: 'Данные из открытых источников', desc: 'Тексты документов берутся из официально опубликованных нормативных правовых актов. Платформа не является государственным ресурсом и не аффилирована с государственными органами.' },
  { icon: History, title: 'История версий', desc: 'Изменения в документах фиксируются. Вы можете сравнить редакции и увидеть, что именно изменилось. Мы не гарантируем, что все изменения отражены мгновенно.' },
  { icon: Link2, title: 'Ссылки на первоисточники', desc: 'Каждый документ и ответ AI содержит ссылки на конкретные нормы. Всегда проверяйте информацию по официальным публикациям.' },
  { icon: Shield, title: 'Открытость об ограничениях', desc: 'Мы прямо сообщаем, что AI может ошибаться, что данные могут быть неполными, и что платформа не заменяет юридическую помощь. Никаких скрытых оговорок.' },
];

function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 id="trust-heading" className="text-center text-3xl font-bold tracking-tight">Прозрачность и доверие</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Мы не используем сертификаты или знаки качества, которые не можем подтвердить. 
          Вместо этого — конкретные принципы работы с информацией.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {trustPoints.map((t) => (
            <div key={t.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent" aria-hidden="true">
                <t.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Право&nbsp;БY — независимый проект. Платформа не является государственным информационным 
          ресурсом и не связана с государственными органами Республики Беларусь.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   7. Call to action
   ────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="bg-primary px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
          Начните работу с правовой информацией
        </h2>
        <p className="mt-4 text-primary-foreground/80">
          Зарегистрируйтесь, чтобы получить доступ к поиску, AI-ассистенту и мониторингу изменений.
          Без обязательств.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-8 text-base px-8">
          <Link to="/app">
            Попробовать бесплатно
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Право БY',
    description: 'Платформа для поиска и работы с нормативными правовыми актами Республики Беларусь.',
    applicationCategory: 'ReferenceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BYN' },
  };

  return (
    <article>
      <PageSEO
        title="Платформа правовой информации Беларуси"
        description="Поиск и работа с нормативными правовыми актами Республики Беларусь. AI-ассистент объясняет нормы простым языком со ссылками на источники."
        path="/"
        jsonLd={jsonLd}
      />
      <HeroSection />
      <WhatSection />
      <AISection />
      <UpdatesSection />
      <AudienceSection />
      <TrustSection />
      <CTASection />
    </article>
  );
}
