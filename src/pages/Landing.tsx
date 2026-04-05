import { Link } from 'react-router-dom';
import {
  Search, FileText, Bot, Shield, RefreshCw, ArrowRight,
  CheckCircle2, XCircle, Scale, Eye,
  Building2, ShoppingCart, BookOpen, Briefcase, Users,
  Clock, Link2, History, ExternalLink,
  Newspaper, TrendingUp, CalendarDays,
} from 'lucide-react';
import { DisclaimerFull } from '@/components/shared/Disclaimers';
import { PageSEO } from '@/components/shared/PageSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/* ──────────────────────────────────────────────
   1. Hero — bold teal gradient
   ────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-teal px-6 py-28 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(174_72%_55%/0.5),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(210_30%_12%/0.15),transparent_50%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2 text-sm font-medium text-primary-foreground/90">
          <Scale className="h-4 w-4" />
          Платформа правовой информации
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl leading-[1.1]">
          Законодательство Беларуси
          <span className="block mt-2 opacity-90">в удобном формате</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
          Полнотекстовый поиск по НПА, экспертная аналитика, календарь сроков и
          AI&#8209;ассистент — всё для бухгалтера и юриста в одном месте.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90 text-base px-8 font-semibold shadow-lg">
            <Link to="/register">
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 text-base border border-primary-foreground/20">
            <Link to="/news">
              Читать новости
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <div className="text-3xl font-extrabold text-primary-foreground">50K+</div>
            <div className="text-sm text-primary-foreground/70 mt-1">Документов</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-primary-foreground">100+</div>
            <div className="text-sm text-primary-foreground/70 mt-1">Тем</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-primary-foreground">24/7</div>
            <div className="text-sm text-primary-foreground/70 mt-1">AI-ассистент</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   2. Quick links ribbon
   ────────────────────────────────────────────── */

const quickLinks = [
  { icon: Newspaper, label: 'Новости', to: '/news', desc: 'Обзоры и аналитика' },
  { icon: Search, label: 'Поиск НПА', to: '/app/search', desc: 'Полнотекстовый поиск' },
  { icon: TrendingUp, label: 'Курсы валют', to: '/app/services/rates', desc: 'НБРБ актуальные' },
  { icon: CalendarDays, label: 'Календарь', to: '/app/services/calendar', desc: 'Сроки отчётности' },
];

function QuickLinksSection() {
  return (
    <section className="relative -mt-8 z-10 px-6">
      <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickLinks.map((q) => (
          <Link key={q.label} to={q.to}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 bg-card border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <q.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{q.label}</div>
                  <div className="text-xs text-muted-foreground">{q.desc}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   3. What this platform does
   ────────────────────────────────────────────── */

const capabilities = [
  { icon: Search, title: 'Полнотекстовый поиск', desc: 'Находите нужные нормы по ключевым словам, номерам документов или датам принятия. Результаты ранжируются по релевантности.' },
  { icon: FileText, title: 'Структурированный просмотр', desc: 'Документы разбиты на статьи, главы и разделы. Навигация позволяет быстро переходить к нужному фрагменту.' },
  { icon: RefreshCw, title: 'Актуальные редакции', desc: 'Платформа отслеживает изменения и обновляет тексты документов. Вы работаете с актуальной версией.' },
  { icon: Bot, title: 'AI-ассистент', desc: 'Объясняет сложные формулировки и помогает найти связанные нормы. Каждый ответ содержит ссылки на источники.' },
  { icon: Eye, title: 'Мониторинг изменений', desc: 'Подписывайтесь на интересующие документы и получайте уведомления о внесённых поправках.' },
  { icon: History, title: 'История редакций', desc: 'Сравнивайте версии документа. Видно, что именно изменилось, когда и каким актом.' },
];

function WhatSection() {
  return (
    <section id="what" className="bg-background px-6 py-20 mt-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Возможности платформы</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Все инструменты для работы с законодательством РБ — от поиска до мониторинга изменений
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.title} className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   4. AI assistant — how it works
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
  'Не несёт ответственности за решения на основе ответов',
];

function AISection() {
  return (
    <section className="bg-muted/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">AI-ассистент</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Работает по принципу «поиск + объяснение» — находит нормы в базе и формулирует ответ на их основе
        </p>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border bg-card p-8 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Как это работает</h3>
          <ol className="mt-5 space-y-4 text-sm">
            {[
              'Вы задаёте вопрос на естественном языке',
              'Система находит релевантные фрагменты в базе НПА',
              'AI формирует ответ с ссылками на первоисточники',
              'Вы переходите к оригиналу документа для проверки',
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-teal text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
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

          <Card className="border-0 shadow-sm">
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
   5. For whom
   ────────────────────────────────────────────── */

const forWhom = [
  { icon: Briefcase, title: 'Предприниматели и ИП', desc: 'Регистрация, налоги, отчётность, лицензирование.' },
  { icon: Building2, title: 'Малый и средний бизнес', desc: 'Трудовое, налоговое и хозяйственное законодательство.' },
  { icon: ShoppingCart, title: 'Интернет-магазины', desc: 'Правила торговли, маркировка, защита прав потребителей.' },
  { icon: Users, title: 'HR и бухгалтеры', desc: 'Кадровые документы, зарплата, отчётность в фонды.' },
  { icon: BookOpen, title: 'Студенты', desc: 'Учебный инструмент для изучения НПА.' },
];

function AudienceSection() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">Для кого эта платформа</h2>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forWhom.map((a) => (
            <Card key={a.title} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   6. Trust & transparency
   ────────────────────────────────────────────── */

const trustPoints = [
  { icon: ExternalLink, title: 'Открытые источники', desc: 'Тексты НПА берутся из официально опубликованных актов. Платформа не является государственным ресурсом.' },
  { icon: History, title: 'История версий', desc: 'Изменения в документах фиксируются. Сравнивайте редакции и видьте, что изменилось.' },
  { icon: Link2, title: 'Ссылки на первоисточники', desc: 'Каждый документ и ответ AI содержит ссылки на конкретные нормы.' },
  { icon: Shield, title: 'Честность об ограничениях', desc: 'AI может ошибаться, данные могут быть неполными — мы сообщаем об этом открыто.' },
];

function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="bg-muted/40 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 id="trust-heading" className="text-center text-3xl font-bold tracking-tight">Прозрачность</h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {trustPoints.map((t) => (
            <div key={t.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Право&nbsp;БY — независимый проект. Не является государственным информационным ресурсом
          и не связан с государственными органами Республики Беларусь.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   7. CTA
   ────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="gradient-teal px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
          Начните работу с правовой информацией
        </h2>
        <p className="mt-4 text-primary-foreground/85 text-lg">
          Бесплатный доступ к базе законодательства, AI-ассистенту и экспертной аналитике
        </p>
        <Button asChild size="lg" className="mt-8 bg-white text-foreground hover:bg-white/90 text-base px-8 font-semibold shadow-lg">
          <Link to="/register">
            Зарегистрироваться
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
      <QuickLinksSection />
      <WhatSection />
      <AISection />
      <AudienceSection />
      <TrustSection />
      <CTASection />
    </article>
  );
}
