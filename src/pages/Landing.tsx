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
  Check, Star,
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
  { label: 'Трудовой кодекс', desc: '461 статья · Трудовые отношения', to: '/documents?q=Трудовой кодекс' },
  { label: 'Налоговый кодекс', desc: '382 статьи · Налоги и сборы', to: '/documents?q=Налоговый кодекс' },
  { label: 'Гражданский кодекс', desc: '1153 статьи · Гражданские правоотношения', to: '/documents?q=Гражданский кодекс' },
  { label: 'Уголовный кодекс', desc: '466 статей · Преступления и наказания', to: '/documents?q=Уголовный кодекс' },
  { label: 'КоАП', desc: '466 статей · Административные правонарушения', to: '/documents?q=КоАП' },
  { label: 'Жилищный кодекс', desc: '224 статьи · Жилищные отношения', to: '/documents?q=Жилищный кодекс' },
  { label: 'Банковский кодекс', desc: '312 статей · Банковская деятельность', to: '/documents?q=Банковский кодекс' },
  { label: 'Кодекс о браке и семье', desc: '241 статья · Семейные отношения', to: '/documents?q=Кодекс о браке и семье' },
  { label: 'Бюджетный кодекс', desc: '149 статей · Бюджетное регулирование', to: '/documents?q=Бюджетный кодекс' },
  { label: 'Закон об ООО', desc: 'Хозяйственные общества', to: '/documents?q=ООО' },
  { label: 'УСН для ИП', desc: 'Упрощённая система', to: '/documents?q=УСН' },
  { label: 'Охрана труда', desc: 'Безопасность на рабочем месте', to: '/documents?q=охрана труда' },
  { label: 'Налоговый календарь', desc: 'Сроки сдачи отчётности', to: '/calendar' },
  { label: 'Закупки', desc: 'Государственные закупки', to: '/documents?q=закупки' },
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

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [npaTab, setNpaTab] = useState<'npa' | 'news'>('npa');

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const { data: latestDocs } = useQuery({
    queryKey: ['landing-latest-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_date, doc_number, created_at, content_text, document_types(slug, name_ru)')
        .order('created_at', { ascending: false }).limit(6);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Новые НПА */}
          <Card className="border border-border rounded-xl p-5 h-[600px] max-h-[600px] flex flex-col">
            <CardHeader className="pb-3 px-0 pt-0 flex-shrink-0">
              <CardTitle className="text-base font-semibold">Новые НПА</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0 flex-1 min-h-0 flex flex-col">
              <div className="divide-y divide-border/50 flex-1 overflow-y-auto min-h-0 pr-1">
                {latestDocs?.map((doc) => {
                  const dt = doc.document_types as any;
                  const dateObj = doc.created_at ? new Date(doc.created_at) : null;
                  const contentText = (doc as any).content_text as string | null;
                  return (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-3 py-2.5 first:pt-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
                    >
                      <div className="w-[52px] shrink-0 text-center">
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
                {(!latestDocs || latestDocs.length === 0) && (
                  <p className="text-sm text-muted-foreground py-4">Нет документов</p>
                )}
                {latestDocs && latestDocs.length > 0 && latestDocs.length < 3 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    Мониторинг pravo.by проверяет обновления каждые 6 часов
                  </p>
                )}
              </div>
              <Link to="/documents?sort=newest" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 flex-shrink-0 transition-colors">
                Все обновления <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Курсы + Показатели + Сроки */}
          <Card className="border border-border rounded-xl p-5 h-[600px] max-h-[600px] flex flex-col">
            <CardHeader className="pb-3 px-0 pt-0 flex-shrink-0">
              <CardTitle className="text-base font-semibold">Курсы НБРБ</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0 flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <div className="divide-y divide-border/50">
                  {rates && rates.length > 0 ? rates.map((r) => {
                    const change = Number(r.change_value) || 0;
                    const flag = CURRENCY_FLAGS[r.currency_code] || '';
                    return (
                      <div key={r.currency_code} className="flex items-center justify-between py-3 first:pt-0">
                        <span className="text-sm font-medium">
                          {flag} {r.currency_code}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
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
                    <p className="text-sm text-muted-foreground py-3">Обновление...</p>
                  )}
                </div>

                <Link to="/currencies" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
                  Все курсы и конвертер <ArrowRight className="h-3 w-3" />
                </Link>

                <div className="border-t border-border mt-3 pt-3">
                  <h3 className="text-base font-semibold mb-2">Показатели</h3>
                  <div className="divide-y divide-border/50">
                    {refRate && (
                      <div className="flex items-center justify-between py-2 first:pt-0">
                        <span className="text-sm text-muted-foreground">Ставка рефинансирования</span>
                        <span className="text-sm font-semibold">{refRate.current_value}</span>
                      </div>
                    )}
                    {minSalary && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">МЗП</span>
                        <span className="text-sm font-semibold">{minSalary.current_value}</span>
                      </div>
                    )}
                    {baseValue && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Базовая величина</span>
                        <span className="text-sm font-semibold">{baseValue.current_value}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Произв. календарь</span>
                      <span className="text-sm font-semibold">{(() => {
                        const cal: Record<number,{h:number,d:number}> = {1:{h:151,d:20},2:{h:160,d:20},3:{h:175,d:22},4:{h:166,d:21},5:{h:159,d:20},6:{h:168,d:21},7:{h:184,d:23},8:{h:168,d:21},9:{h:176,d:22},10:{h:176,d:22},11:{h:160,d:20},12:{h:175,d:22}};
                        const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
                        const m = new Date().getMonth() + 1;
                        const c = cal[m];
                        return `${months[m-1]}: ${c.h} ч / ${c.d} дн.`;
                      })()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border mt-3 pt-3">
                  <h3 className="text-base font-semibold mb-2">Ближайшие сроки</h3>
                  <div className="divide-y divide-border/50">
                    {deadlines?.map((d) => (
                      <div key={d.id} className="flex items-start gap-3 py-2.5 first:pt-0">
                        <div className="rounded bg-muted px-2 py-0.5 text-sm font-medium text-foreground shrink-0">
                          {formatDate(d.deadline_date)}
                        </div>
                        <span className="text-sm">{d.title}</span>
                      </div>
                    ))}
                    {(!deadlines || deadlines.length === 0) && <p className="text-sm text-muted-foreground py-2">Нет ближайших дедлайнов</p>}
                  </div>
                </div>
              </div>

              <Link to="/calendar" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 flex-shrink-0 transition-colors">
                Календарь <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Популярные разделы */}
          <Card className="border border-border rounded-xl p-5 h-[600px] max-h-[600px] flex flex-col">
            <CardHeader className="pb-3 px-0 pt-0 flex-shrink-0">
              <CardTitle className="text-base font-semibold">Популярные разделы</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0 flex-1 min-h-0">
              <div className="divide-y divide-border/50 h-full overflow-y-auto pr-1">
                {popularSections.map((s) => (
                  <Link
                    key={s.label}
                    to={s.to}
                    className="flex items-center justify-between py-2 first:pt-0 hover:bg-muted -mx-2 px-2 rounded-lg transition-all duration-150 group"
                  >
                    <div className="min-w-0">
                      <span className="text-base font-medium text-foreground">{s.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

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
