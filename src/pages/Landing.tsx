import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/shared/PageSEO';
import {
  Search, ArrowRight, TrendingUp, TrendingDown, Minus,
  BookOpen, Scale, FileText, Building2, Calculator, Users,
  HardHat, CalendarDays, Check, Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const quickTags = [
  { label: 'Кодексы', filter: 'codex' },
  { label: 'Законы', filter: 'law' },
  { label: 'Указы', filter: 'decree' },
  { label: 'НДС', q: 'НДС' },
  { label: 'Трудовой кодекс', q: 'Трудовой кодекс' },
  { label: 'Налоговый кодекс', q: 'Налоговый кодекс' },
  { label: 'ФСЗН', q: 'ФСЗН' },
  { label: 'УСН', q: 'УСН' },
];

const popularSections = [
  { icon: BookOpen, label: 'Трудовой кодекс', to: '/documents?q=Трудовой кодекс' },
  { icon: Calculator, label: 'Налоговый кодекс', to: '/documents?q=Налоговый кодекс' },
  { icon: Scale, label: 'Гражданский кодекс', to: '/documents?q=Гражданский кодекс' },
  { icon: Building2, label: 'Закон об ООО', to: '/documents?q=ООО' },
  { icon: FileText, label: 'НДС — декларация', to: '/documents?q=НДС' },
  { icon: Users, label: 'УСН для ИП', to: '/documents?q=УСН' },
  { icon: HardHat, label: 'Охрана труда', to: '/documents?q=охрана труда' },
  { icon: CalendarDays, label: 'Налоговый календарь', to: '/calendar' },
];

const pricingPlans = [
  {
    name: 'Бесплатный', price: '0',
    features: ['Кодексы + топ-200 законов', '5 AI-запросов/день', 'Курсы НБРБ и календарь'],
    cta: 'Начать бесплатно', to: '/register', popular: false,
  },
  {
    name: 'Стандарт', price: '19',
    features: ['Все НПА без ограничений', 'Закладки', 'Подписки на изменения'],
    cta: 'Подключить', to: '/pricing', popular: false,
  },
  {
    name: 'Профи', price: '49',
    features: ['AI без лимитов', 'История редакций', 'Экспорт в PDF', 'Приоритетная поддержка'],
    cta: 'Подключить', to: '/pricing', popular: true,
  },
  {
    name: 'Бизнес', price: '149',
    features: ['Всё из Профи', '5 пользователей', 'API доступ', 'SLA'],
    cta: 'Подключить', to: '/pricing', popular: false,
  },
];

const docTypeLabel: Record<string, string> = {
  codex: 'Кодекс', law: 'Закон', decree: 'Указ', resolution: 'Постановление',
};

function formatDate(d: string | null) {
  if (!d) return '';
  try { return format(new Date(d), 'd MMM yyyy', { locale: ru }); } catch { return d; }
}

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const { data: latestDocs } = useQuery({
    queryKey: ['landing-latest-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_type, date_adopted, updated_at')
        .order('updated_at', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: rates } = useQuery({
    queryKey: ['landing-rates'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, currency_name, rate, change_value, rate_date')
        .in('currency_code', ['USD', 'EUR', 'RUB'])
        .order('rate_date', { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  const { data: deadlines } = useQuery({
    queryKey: ['landing-deadlines'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('deadline_calendar')
        .select('id, title, deadline_date')
        .gte('deadline_date', today)
        .order('deadline_date', { ascending: true }).limit(3);
      return data ?? [];
    },
  });

  // TODO: sort by view_count when column is added
  const { data: popularDocs } = useQuery({
    queryKey: ['landing-popular-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_type, date_adopted')
        .order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const { data: recentChanges } = useQuery({
    queryKey: ['landing-recent-changes'],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await supabase.from('documents')
        .select('id, title, doc_type, updated_at')
        .gte('updated_at', weekAgo.toISOString())
        .order('updated_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Правовой портал Беларуси',
    description: 'Законодательство Республики Беларусь онлайн — полные тексты кодексов и законов бесплатно',
    inLanguage: 'ru',
  };

  return (
    <article>
      <PageSEO
        title="Законодательство Беларуси онлайн"
        description="Полные тексты 26 кодексов и 200+ законов Беларуси бесплатно. Поиск по НПА, налоговый календарь, AI-ассистент для бухгалтеров и юристов."
        path="/"
        jsonLd={[websiteJsonLd]}
      />

      {/* ═══ HERO ═══ */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-b from-accent/40 to-background">
        <h1 className="text-4xl md:text-6xl font-bold text-center max-w-4xl leading-tight">
          Законодательство Беларуси —{' '}
          <span className="text-primary">бесплатно</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground text-center max-w-2xl">
          Полные тексты 26 кодексов и 200+ законов без регистрации. Поиск по НПА, AI-ассистент, налоговый календарь.
        </p>

        <div className="mt-8 w-full max-w-3xl">
          <div className="flex items-center gap-0 rounded-xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Найдите кодекс, закон, указ... например: Трудовой кодекс"
              className="flex-1 bg-transparent px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
            />
            <Button onClick={handleSearch} className="m-1.5 rounded-lg px-6">Найти</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {quickTags.map((tag) => (
            <Link
              key={tag.label}
              to={tag.filter ? `/documents?filter=${tag.filter}` : `/documents?q=${encodeURIComponent(tag.q!)}`}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ THREE COLUMNS ═══ */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Col 1 — Latest docs */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Последние НПА</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestDocs?.map((doc) => (
                <div key={doc.id} className="flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0 text-[10px] mt-0.5">
                    {docTypeLabel[doc.doc_type] || doc.doc_type}
                  </Badge>
                  <div className="min-w-0">
                    <Link to={`/documents/${doc.id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.date_adopted)}</p>
                  </div>
                </div>
              ))}
              {(!latestDocs || latestDocs.length === 0) && <p className="text-sm text-muted-foreground">Нет документов</p>}
              <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                <Link to="/documents">Все документы <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Col 2 — Rates + Deadlines */}
          <div className="space-y-6">
            <Card className="rounded-xl shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Курсы НБРБ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rates?.map((r) => {
                  const change = Number(r.change_value) || 0;
                  return (
                    <div key={r.currency_code} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.currency_code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                        <span className={`flex items-center text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : change < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                          {change !== 0 ? Math.abs(change).toFixed(4) : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(!rates || rates.length === 0) && <p className="text-sm text-muted-foreground">Загрузка курсов...</p>}
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ближайшие дедлайны</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlines?.map((d) => (
                  <div key={d.id} className="flex items-start gap-3">
                    <div className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground shrink-0">
                      {formatDate(d.deadline_date)}
                    </div>
                    <span className="text-sm">{d.title}</span>
                  </div>
                ))}
                {(!deadlines || deadlines.length === 0) && <p className="text-sm text-muted-foreground">Нет ближайших дедлайнов</p>}
                <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                  <Link to="/calendar">Календарь <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Col 3 — Popular sections */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Популярные разделы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {popularSections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {s.label}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ POPULAR DOCUMENTS ═══ */}
      {popularDocs && popularDocs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="text-2xl font-bold mb-6">Популярные документы</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {popularDocs.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition group">
                <Badge variant="secondary" className="text-[10px] mb-2">{docTypeLabel[doc.doc_type] || doc.doc_type}</Badge>
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(doc.date_adopted)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ RECENT CHANGES ═══ */}
      {recentChanges && recentChanges.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="text-2xl font-bold mb-6">Изменения за последние 7 дней</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            {recentChanges.map((doc, i) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className={`flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors ${i !== 0 ? 'border-t' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{docTypeLabel[doc.doc_type] || doc.doc_type}</Badge>
                  <span className="text-sm font-medium truncate">{doc.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</span>
                  <Badge className="bg-warning text-warning-foreground text-[10px]">ИЗМЕНЁН</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PRICING ═══ */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">Простые и честные тарифы</h2>
          <p className="mt-2 text-muted-foreground">Все кодексы и 200+ законов — бесплатно, без регистрации</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={`rounded-xl shadow-sm hover:shadow-md transition relative ${plan.popular ? 'border-2 border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Популярный</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm"> BYN{plan.price !== '0' ? '/мес' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.popular ? 'default' : 'outline'} className="w-full rounded-lg">
                  <Link to={plan.to}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </article>
  );
}
