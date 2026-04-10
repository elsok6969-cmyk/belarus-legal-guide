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
  HardHat, CalendarDays, Check, Star, Briefcase, ShoppingCart,
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
  { icon: FileText, label: 'Уголовный кодекс', to: '/documents?q=Уголовный кодекс' },
  { icon: Building2, label: 'Закон об ООО', to: '/documents?q=ООО' },
  { icon: Users, label: 'УСН для ИП', to: '/documents?q=УСН' },
  { icon: HardHat, label: 'Охрана труда', to: '/documents?q=охрана труда' },
  { icon: CalendarDays, label: 'Налоговый календарь', to: '/calendar' },
  { icon: Briefcase, label: 'КоАП', to: '/documents?q=КоАП' },
  { icon: ShoppingCart, label: 'Закупки', to: '/documents?q=закупки' },
];

const audienceTags = [
  { label: 'Бухгалтеру', profession: 'accountant' },
  { label: 'Юристу', profession: 'lawyer' },
  { label: 'Кадровику', profession: 'hr' },
  { label: 'По закупкам', profession: 'procurement' },
  { label: 'Экономисту', profession: 'economist' },
  { label: 'ИП', profession: 'entrepreneur' },
];

const pricingPlans = [
  {
    name: 'Пробный', price: '0', desc: 'Для знакомства с сервисом',
    features: ['Курсы валют НБРБ', 'Календарь дедлайнов', 'Новости и статьи', 'Помощник — 3 вопроса'],
    cta: 'Начать', to: '/register', popular: false,
  },
  {
    name: 'Персональный', price: '69', desc: 'Для физических лиц',
    features: ['Все кодексы и законы', 'Поиск — безлимитно', 'Калькуляторы — все', 'Помощник — 30 вопросов/день'],
    cta: 'Оформить подписку', to: '/subscribe/personal', popular: true,
  },
  {
    name: 'Корпоративный', price: '99', desc: 'Для юридических лиц и ИП',
    features: ['Всё из Персонального', 'Помощник — безлимитно', 'Экспорт PDF/DOCX', 'Приоритетная поддержка'],
    cta: 'Оформить подписку', to: '/subscribe/corporate', popular: false,
  },
];

const CURRENCY_ORDER = ['USD', 'EUR', 'RUB', 'CNY', 'PLN'];
const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳', PLN: '🇵🇱',
};

function formatDate(d: string | null) {
  if (!d) return '';
  try { return format(new Date(d), 'd MMM yyyy', { locale: ru }); } catch { return d; }
}

function formatShortDate(d: string | null) {
  if (!d) return '';
  try { return format(new Date(d), 'dd.MM.yyyy'); } catch { return d; }
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
        .select('id, title, doc_date, doc_number, created_at, content_text, document_types(slug, name_ru)')
        .order('created_at', { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  const { data: rates } = useQuery({
    queryKey: ['landing-rates'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, currency_name, rate, change_value, rate_date')
        .in('currency_code', CURRENCY_ORDER)
        .order('rate_date', { ascending: false }).limit(10);
      const seen = new Set<string>();
      const deduped = (data ?? []).filter(r => {
        if (seen.has(r.currency_code)) return false;
        seen.add(r.currency_code);
        return true;
      });
      return deduped.sort((a, b) => CURRENCY_ORDER.indexOf(a.currency_code) - CURRENCY_ORDER.indexOf(b.currency_code));
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

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Бабиджон',
    description: 'Законодательство Республики Беларусь онлайн — полные тексты кодексов и законов',
    inLanguage: 'ru',
  };

  const refRate = indicators?.find(i => i.slug === 'refinancing-rate');
  const minSalary = indicators?.find(i => i.slug === 'min-salary');
  const baseValue = indicators?.find(i => i.slug === 'base-value');

  return (
    <article>
      <PageSEO
        title="Законодательство Беларуси онлайн"
        description="Полные тексты 26 кодексов и 200+ законов Беларуси. Поиск по НПА, налоговый календарь, помощник для бухгалтеров и юристов."
        path="/"
        jsonLd={[websiteJsonLd]}
      />

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center px-4 md:px-6 pt-8 pb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center max-w-3xl leading-tight">
          Законодательство Беларуси — <span className="text-primary">удобно</span>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground text-center max-w-xl">
          Все кодексы и законы с навигацией по статьям. Поиск, калькуляторы, налоговый календарь.
        </p>

        <div className="mt-5 w-full max-w-[680px]">
          <div className="flex items-center gap-0 rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring">
            <Search className="ml-3 md:ml-5 h-5 w-5 md:h-6 md:w-6 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Найдите кодекс, закон, указ..."
              className="flex-1 bg-transparent px-3 md:px-4 py-3 md:py-4 text-base md:text-lg outline-none placeholder:text-muted-foreground min-w-0"
            />
            <Button onClick={handleSearch} size="lg" className="m-1.5 md:m-2 rounded-lg px-4 md:px-8 text-sm md:text-base min-h-[44px]">Найти</Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          {quickTags.map((tag) => (
            <Link
              key={tag.label}
              to={tag.filter ? `/documents?filter=${tag.filter}` : `/documents?q=${encodeURIComponent(tag.q!)}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ THREE COLUMNS ═══ */}
      <section className="mx-auto max-w-7xl px-4 mt-4 pb-10">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 items-stretch">

          {/* Новые НПА */}
          <Card className="border border-border rounded-xl p-4 md:p-6 min-h-[420px]">
            <CardHeader className="pb-3 px-0 pt-0">
              <CardTitle className="text-lg font-semibold">Новые НПА</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="divide-y divide-border/50">
                {latestDocs?.map((doc) => {
                  const dt = doc.document_types as any;
                  const dateObj = doc.created_at ? new Date(doc.created_at) : null;
                  const contentText = (doc as any).content_text as string | null;
                  return (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-3 py-3 first:pt-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
                    >
                      <div className="w-[60px] shrink-0 text-center">
                        {dateObj && (
                          <>
                            <div className="text-sm font-semibold leading-tight">
                              {format(dateObj, 'd MMM', { locale: ru })}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {format(dateObj, 'yyyy')}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {dt?.name_ru || 'Документ'}
                          </Badge>
                          {doc.doc_number && (
                            <span className="text-[11px] text-muted-foreground">№ {doc.doc_number}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {doc.title && doc.title.length > 65 ? doc.title.substring(0, 65) + '...' : doc.title}
                        </p>
                        {contentText && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {contentText.substring(0, 80)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
              {(!latestDocs || latestDocs.length === 0) && (
                <p className="text-sm text-muted-foreground py-4">Нет документов</p>
              )}
              {latestDocs && latestDocs.length > 0 && latestDocs.length < 3 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Мониторинг pravo.by проверяет обновления каждые 6 часов
                </p>
              )}
              <Button asChild variant="ghost" size="sm" className="w-full mt-3">
                <Link to="/documents?sort=newest">Все обновления <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Курсы + Дедлайны */}
          <div className="space-y-4 md:space-y-6 flex flex-col">
            <Card className="border border-border rounded-xl p-4 md:p-6 flex-1">
              <CardHeader className="pb-3 px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Курсы НБРБ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                {rates && rates.length > 0 ? rates.map((r) => {
                  const change = Number(r.change_value) || 0;
                  const flag = CURRENCY_FLAGS[r.currency_code] || '';
                  return (
                    <div key={r.currency_code} className="flex items-center justify-between py-0.5">
                      <span className="text-sm font-medium">
                        {flag} {r.currency_code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                        <span className={`flex items-center text-xs tabular-nums ${change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {change > 0 ? (
                            <><TrendingUp className="h-3 w-3 mr-0.5" />+{Math.abs(change).toFixed(4)}</>
                          ) : change < 0 ? (
                            <><TrendingDown className="h-3 w-3 mr-0.5" />-{Math.abs(change).toFixed(4)}</>
                          ) : (
                            <><Minus className="h-3 w-3 mr-0.5" />0.0000</>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">Обновление...</p>
                )}
                <Button asChild variant="ghost" size="sm" className="w-full mt-3">
                  <Link to="/currencies">Все курсы и конвертер <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border rounded-xl p-4 md:p-6 flex-1">
              <CardHeader className="pb-3 px-0 pt-0">
                <CardTitle className="text-lg font-semibold">Ближайшие сроки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                {deadlines?.map((d) => (
                  <div key={d.id} className="flex items-start gap-3">
                    <div className="rounded bg-muted px-2 py-1 text-xs font-semibold text-foreground shrink-0">
                      {formatDate(d.deadline_date)}
                    </div>
                    <span className="text-sm">{d.title}</span>
                  </div>
                ))}
                {(!deadlines || deadlines.length === 0) && <p className="text-sm text-muted-foreground">Нет ближайших дедлайнов</p>}
                <Button asChild variant="ghost" size="sm" className="w-full mt-3">
                  <Link to="/calendar">Календарь <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Популярные разделы */}
          <Card className="border border-border rounded-xl p-4 md:p-6 min-h-[420px]">
            <CardHeader className="pb-3 px-0 pt-0">
              <CardTitle className="text-lg font-semibold">Популярные разделы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-0 pb-0 pt-0">
              {popularSections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <Icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ INFORMERS ═══ */}
      {(refRate || minSalary || baseValue) && (
        <section className="border-y border-border bg-muted py-4">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {refRate && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Ставка рефинансирования</p>
                  <p className="text-lg font-semibold text-foreground">{refRate.current_value}</p>
                </div>
              )}
              {minSalary && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">МЗП</p>
                  <p className="text-lg font-semibold text-foreground">{minSalary.current_value}</p>
                </div>
              )}
              {baseValue && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Базовая величина</p>
                  <p className="text-lg font-semibold text-foreground">{baseValue.current_value}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ POPULAR DOCUMENTS (simple list) ═══ */}
      {popularDocs && popularDocs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="text-lg font-semibold mb-4">Популярные документы</h2>
          <div>
            {popularDocs.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="flex items-center justify-between py-3 border-b border-border/50 hover:bg-muted/50 px-2 rounded transition-colors group"
              >
                <span className="text-sm font-medium text-foreground line-clamp-1 min-w-0 mr-4">
                  {doc.title}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatShortDate(doc.doc_date)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ AUDIENCE PILLS ═══ */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="flex flex-wrap justify-center gap-2.5">
          {audienceTags.map((a) => (
            <Link
              key={a.label}
              to={`/documents?audience=${a.profession}`}
              className="border border-border rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold">Тарифы</h2>
          <p className="mt-2 text-sm text-muted-foreground">Выберите план, подходящий для ваших задач</p>
        </div>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={`border border-border rounded-xl p-4 md:p-6 relative ${plan.popular ? 'border-2 border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[11px]">
                    <Star className="h-3 w-3 mr-1" /> Популярный
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-0 px-0">
                <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm"> BYN{plan.price !== '0' ? '/мес' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-0 pb-0">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.popular ? 'default' : 'outline'} size="sm" className="w-full rounded-lg min-h-[44px]">
                  <Link to={plan.to}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ EMAIL CAPTURE ═══ */}
      <section className="mx-auto max-w-2xl px-4 pb-12">
        <InlineEmailForm source="landing" />
      </section>
    </article>
  );
}
