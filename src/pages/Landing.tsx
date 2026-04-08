import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
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

const features = [
  { emoji: '🔍', title: 'Полнотекстовый поиск', desc: 'Ищите по тексту документов, не только по названию' },
  { emoji: '📑', title: 'Фокус на статье', desc: 'Читайте только нужную статью, а не весь кодекс' },
  { emoji: '🤖', title: 'AI-помощник', desc: 'Задайте вопрос — получите ответ со ссылками' },
  { emoji: '🔗', title: 'Связи между статьями', desc: 'Ссылки на другие статьи кликабельны' },
  { emoji: '📅', title: 'Календарь дедлайнов', desc: 'Налоговые сроки с напоминаниями' },
  { emoji: '💱', title: 'Курсы и показатели', desc: 'Курсы НБРБ и экономические индикаторы' },
];

const audiences = [
  { emoji: '👨‍💼', label: 'Бухгалтер', profession: 'accountant' },
  { emoji: '⚖️', label: 'Юрист', profession: 'lawyer' },
  { emoji: '👷', label: 'Кадровик', profession: 'hr' },
  { emoji: '🛒', label: 'Закупки', profession: 'procurement' },
  { emoji: '💹', label: 'Экономист', profession: 'economist' },
  { emoji: '👤', label: 'ИП', profession: 'entrepreneur' },
];

const pricingPlans = [
  {
    name: 'Бесплатный', price: '0',
    features: ['26 кодексов РБ', '3 AI-запроса/день', 'Курсы НБРБ и календарь'],
    cta: 'Начать бесплатно', to: '/register', popular: false,
  },
  {
    name: 'Базовый', price: '29',
    features: ['Все НПА без ограничений', '30 AI-запросов/день', 'Избранное и контроль'],
    cta: 'Подключить', to: '/pricing', popular: true,
  },
  {
    name: 'Про', price: '59',
    features: ['AI без лимитов', 'Все калькуляторы', 'Экспорт в PDF', 'Приоритетная поддержка'],
    cta: 'Подключить', to: '/pricing', popular: false,
  },
];

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
        .select('id, title, doc_date, last_updated, document_types(slug, name_ru)')
        .order('last_updated', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: rates } = useQuery({
    queryKey: ['landing-rates'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, currency_name, rate, change_value, rate_date')
        .in('currency_code', ['USD', 'EUR', 'RUB', 'CNY', 'PLN'])
        .order('rate_date', { ascending: false }).limit(10);
      // Deduplicate: keep only the latest entry per currency
      const seen = new Set<string>();
      return (data ?? []).filter(r => {
        if (seen.has(r.currency_code)) return false;
        seen.add(r.currency_code);
        return true;
      });
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

  const { data: indicators } = useQuery({
    queryKey: ['landing-indicators'],
    queryFn: async () => {
      const { data } = await supabase.from('economic_indicators').select('*');
      return data ?? [];
    },
  });

  const { data: popularDocs } = useQuery({
    queryKey: ['landing-popular-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_date, document_types(slug, name_ru)')
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
        .select('id, title, last_updated, document_types(slug, name_ru)')
        .gte('last_updated', weekAgo.toISOString())
        .order('last_updated', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Бабиджон',
    description: 'Законодательство Республики Беларусь онлайн — полные тексты кодексов и законов бесплатно',
    inLanguage: 'ru',
  };

  const getDocTypeLabel = (doc: any) => {
    const dt = doc.document_types as any;
    return dt?.name_ru || '';
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
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 pt-16 pb-12 md:pt-24 md:pb-16 bg-gradient-to-b from-accent/40 to-background">
        <h1 className="text-4xl md:text-6xl font-bold text-center max-w-4xl leading-tight">
          Законодательство Беларуси —{' '}
          <span className="text-primary">бесплатно</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground text-center max-w-2xl">
          Полные тексты 26 кодексов и 200+ законов без регистрации. Поиск по НПА, AI-ассистент, налоговый календарь.
        </p>

        <div className="mt-8 w-full max-w-[640px]">
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
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary hover:bg-accent transition-all duration-200"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ THREE COLUMNS ═══ */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          <Card className="rounded-xl border hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Последние НПА</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestDocs?.map((doc) => (
                <div key={doc.id} className="flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0 text-[10px] mt-0.5">
                    {getDocTypeLabel(doc)}
                  </Badge>
                  <div className="min-w-0">
                    <Link to={`/documents/${doc.id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.doc_date)}</p>
                  </div>
                </div>
              ))}
              {(!latestDocs || latestDocs.length === 0) && <p className="text-sm text-muted-foreground">Нет документов</p>}
              <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                <Link to="/documents">Все документы <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6 flex flex-col">
            <Card className="rounded-xl border hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Курсы НБРБ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rates && rates.length > 0 ? rates.map((r) => {
                  const change = Number(r.change_value) || 0;
                  return (
                    <div key={r.currency_code} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.currency_code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                        <span className={`flex items-center text-xs ${change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : change < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                          {change !== 0 ? Math.abs(change).toFixed(4) : '—'}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">Обновление...</p>
                )}
                <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                  <Link to="/currencies">Все курсы и конвертер <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl border hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 flex-1">
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

          <Card className="rounded-xl border hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Популярные разделы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {popularSections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {s.label}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ INFORMERS ═══ */}
      {indicators && indicators.length > 0 && (
        <section className="bg-muted/50 py-5">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex gap-6 md:gap-10 overflow-x-auto scrollbar-thin pb-1">
              {indicators.map((ind) => (
                <div key={ind.id} className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{ind.name_ru}:</span>
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">{ind.current_value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FEATURES ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Почему Бабиджон</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ AUDIENCE ═══ */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Для профессионалов</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {audiences.map((a) => (
              <Link
                key={a.label}
                to={`/documents?audience=${a.profession}`}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-2.5 text-[15px] font-medium text-foreground hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
              >
                <span>{a.emoji}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POPULAR DOCUMENTS ═══ */}
      {popularDocs && popularDocs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-6">Популярные документы</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {popularDocs.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="rounded-xl border bg-card p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-border/80 transition-all duration-200 group">
                <Badge variant="secondary" className="text-[10px] mb-2">{getDocTypeLabel(doc)}</Badge>
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(doc.doc_date)}</p>
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
              <Link key={doc.id} to={`/documents/${doc.id}`} className={`flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-all duration-200 ${i !== 0 ? 'border-t' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{getDocTypeLabel(doc)}</Badge>
                  <span className="text-sm font-medium truncate">{doc.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">{formatDate(doc.last_updated)}</span>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={`rounded-xl hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 relative ${plan.popular ? 'border-2 border-primary' : ''}`}>
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

      {/* ═══ EMAIL CAPTURE ═══ */}
      <section className="mx-auto max-w-2xl px-4 pb-16">
        <InlineEmailForm
          source="landing"
          title="📧 Будьте в курсе изменений"
          description="Получайте еженедельный обзор изменений в законодательстве Беларуси"
        />
      </section>
    </article>
  );
}
