import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/shared/PageSEO';
import { Search, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
  { label: 'Закон об ООО', desc: 'Хозяйственные общества', to: '/documents?q=ООО' },
  { label: 'УСН для ИП', desc: 'Упрощённая система', to: '/documents?q=УСН' },
  { label: 'Налоговый календарь', desc: 'Сроки сдачи отчётности', to: '/calendar' },
  { label: 'Калькуляторы', desc: 'НДС, налоги, отпускные', to: '/calculators' },
];

const audienceTags = [
  { label: 'Бухгалтеру', profession: 'accountant' },
  { label: 'Юристу', profession: 'lawyer' },
  { label: 'Кадровику', profession: 'hr' },
  { label: 'По закупкам', profession: 'procurement' },
  { label: 'Экономисту', profession: 'economist' },
  { label: 'ИП', profession: 'entrepreneur' },
];

const toolCards = [
  { title: 'Калькулятор НДС', desc: 'Выделить или начислить', to: '/calculator/nds' },
  { title: 'Подоходный налог', desc: 'Расчёт с вычетами', to: '/calculator/income-tax' },
  { title: 'Курсы валют', desc: 'Конвертер + все курсы НБРБ', to: '/currencies' },
  { title: 'Произв. календарь', desc: 'Рабочие дни и часы 2026', to: '/production-calendar' },
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
  

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const { data: latestDocs } = useQuery({
    queryKey: ['landing-latest-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_date, doc_number, created_at, content_text, document_types(slug, name_ru)')
        .order('created_at', { ascending: false }).limit(7);
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

  const { data: latestNews } = useQuery({
    queryKey: ['landing-news'],
    queryFn: async () => {
      const { data } = await supabase.from('articles')
        .select('id, title, slug, excerpt, body, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false }).limit(3);
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
    url: 'https://babijon.by',
    description: 'Удобный доступ к законодательству Республики Беларусь',
    inLanguage: 'ru',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://babijon.by/documents?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const refRate = indicators?.find(i => i.slug === 'refinancing-rate');
  const minSalary = indicators?.find(i => i.slug === 'min-salary');
  const baseValue = indicators?.find(i => i.slug === 'base-value');

  return (
    <article className="overflow-x-hidden">
      <PageSEO
        title="Бабиджон — законодательство Беларуси удобно"
        description="Кодексы и законы РБ с навигацией по статьям. Поиск, калькуляторы, налоговый календарь, курсы валют НБРБ."
        path="/"
        jsonLd={[websiteJsonLd]}
      />

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center px-4 pt-6 md:pt-8 pb-4 md:pb-6">
        <h1 className="text-xl md:text-3xl font-bold text-center max-w-3xl leading-tight">
          Законодательство Беларуси — <span className="text-primary">удобно</span>
        </h1>
        <p className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground text-center max-w-xl">
          Все кодексы и законы с навигацией по статьям. Поиск, калькуляторы, налоговый календарь.
        </p>

        <div className="mt-5 w-full max-w-xl">
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

        <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:gap-2.5">
          {quickTags.map((tag) => (
            <Link
              key={tag.label}
              to={tag.filter ? `/documents?filter=${tag.filter}` : `/documents?q=${encodeURIComponent(tag.q!)}`}
              className="rounded-full border border-border px-2 md:px-4 py-1 md:py-1.5 text-[11px] md:text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ THREE COLUMNS ═══ */}
      <section className="mx-auto max-w-7xl px-4 mt-4 pb-6 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          {/* Новые НПА */}
          <Card className="border border-border rounded-xl p-4 max-h-none md:max-h-[550px] flex flex-col">
            <h2 className="text-base font-semibold mb-2">Новые НПА</h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="divide-y divide-border/30">
                {latestDocs?.map((doc) => {
                  const dt = doc.document_types as any;
                  const dateObj = doc.created_at ? new Date(doc.created_at) : null;
                  const contentText = (doc as any).content_text as string | null;
                  return (
                    <Link
                      key={doc.id}
                      to={`/documents/${(doc as any).slug || doc.id}`}
                      className="flex items-center gap-3 py-2 first:pt-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
                    >
                      <div className="w-[50px] shrink-0 text-center">
                        {dateObj && (
                          <span className="text-xs text-muted-foreground">
                            {format(dateObj, 'd MMM', { locale: ru })}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                            {dt?.name_ru || 'Документ'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {doc.title}
                        </p>
                        {contentText && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {contentText.substring(0, 60)}
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
              </div>
            </div>
            <Link to="/documents?sort=newest" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-auto pt-3 transition-colors">
              Все обновления <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          {/* Курсы + Показатели + Сроки */}
          <Card className="border border-border rounded-xl p-4 max-h-none md:max-h-[550px] flex flex-col">
            <h2 className="text-base font-semibold mb-2">Курсы НБРБ</h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              {rates && rates.length > 0 ? rates.map((r) => {
                const change = Number(r.change_value) || 0;
                const flag = CURRENCY_FLAGS[r.currency_code] || '';
                return (
                  <div key={r.currency_code} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium">{flag} {r.currency_code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                      <span className={`flex items-center text-xs tabular-nums ${change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {change > 0 ? <><TrendingUp className="h-3 w-3 mr-0.5" />+{Math.abs(change).toFixed(4)}</> : change < 0 ? <><TrendingDown className="h-3 w-3 mr-0.5" />-{Math.abs(change).toFixed(4)}</> : <><Minus className="h-3 w-3 mr-0.5" />0.0000</>}
                      </span>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground py-3">Обновление...</p>}

              <Link to="/currencies" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2 transition-colors">
                Все курсы <ArrowRight className="h-3 w-3" />
              </Link>

              <div className="border-t my-3" />
              <h3 className="text-base font-semibold mb-2">Показатели</h3>
              {[
                { label: 'Ставка рефинансирования', value: refRate?.current_value || '9.75%' },
                { label: 'МЗП', value: minSalary?.current_value || '858 BYN' },
                { label: 'Базовая величина', value: baseValue?.current_value || '45 BYN' },
                { label: (() => {
                  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
                  return `Произв. календарь (${months[new Date().getMonth()]})`;
                })(), value: (() => {
                  const cal: Record<number,{h:number,d:number}> = {0:{h:151,d:20},1:{h:160,d:20},2:{h:175,d:22},3:{h:166,d:21},4:{h:159,d:20},5:{h:168,d:21},6:{h:184,d:23},7:{h:168,d:21},8:{h:176,d:22},9:{h:176,d:22},10:{h:160,d:20},11:{h:175,d:22}};
                  const c = cal[new Date().getMonth()];
                  return `${c.h} ч / ${c.d} дн.`;
                })() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold">{row.value}</span>
                </div>
              ))}

              <div className="border-t my-3" />
              <h3 className="text-base font-semibold mb-2">Ближайшие сроки</h3>
              {deadlines?.map((d) => (
                <div key={d.id} className="mb-2">
                  <span className="text-xs font-medium text-primary">{formatDate(d.deadline_date)}</span>
                  <p className="text-sm">{d.title}</p>
                </div>
              ))}
              {(!deadlines || deadlines.length === 0) && <p className="text-sm text-muted-foreground">Нет дедлайнов</p>}
            </div>
            <Link to="/calendar" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-auto pt-3 transition-colors">
              Календарь <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          {/* Популярные разделы */}
          <Card className="border border-border rounded-xl p-4 max-h-none md:max-h-[550px] flex flex-col">
            <h2 className="text-base font-semibold mb-2">Популярные разделы</h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              {popularSections.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className="flex items-center justify-between py-2 border-b border-border/30 hover:bg-muted/50 -mx-2 px-2 rounded transition-all group"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{s.label}</span>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ═══ BLOCK 3: ИНСТРУМЕНТЫ ═══ */}
      <section className="bg-muted/30 py-6 md:py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-lg md:text-xl font-semibold text-center mb-4 md:mb-6">Инструменты</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {toolCards.map((t) => (
              <Link key={t.to} to={t.to} className="bg-background border rounded-lg p-3 md:p-4 hover:shadow-sm hover:border-foreground/20 transition-all text-center">
                <p className="text-xs md:text-sm font-medium">{t.title}</p>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCK 4: ПРОФЕССИИ ═══ */}
      <section className="py-5 md:py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
            {audienceTags.map((a) => (
              <Link
                key={a.label}
                to={`/documents?profession=${a.profession}`}
                className="border rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCK 5: НОВОСТИ ═══ */}
      {latestNews && latestNews.length > 0 && (
        <section className="py-6 md:py-10">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Новости законодательства</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestNews.map((article) => {
                const excerpt = article.excerpt || (article.body ? article.body.replace(/[#*_\[\]]/g, '').substring(0, 80) : '');
                return (
                  <Link key={article.id} to={`/news/${article.slug}`} className="border rounded-xl p-4 hover:shadow-sm transition-all block">
                    <span className="text-xs text-muted-foreground">
                      {article.published_at ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: ru }) : ''}
                    </span>
                    <h3 className="text-sm font-semibold mt-1 line-clamp-2">{article.title}</h3>
                    {excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{excerpt.substring(0, 80)}</p>}
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium mt-2">Общее</Badge>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-6">
              <Link to="/news" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Все новости <ArrowRight className="h-3 w-3 inline" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ BLOCK 6: CTA ═══ */}
      <section className="bg-muted/30 py-8 md:py-10 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-lg md:text-xl font-semibold">Полный доступ к законодательству</h2>
          <p className="text-sm text-muted-foreground mt-2">Все кодексы, законы и указы с навигацией по статьям</p>
          <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-3 mt-4">
            <Button asChild className="w-full md:w-auto"><Link to="/pricing">Оформить подписку</Link></Button>
            <Button asChild variant="outline" className="w-full md:w-auto"><Link to="/auth">Попробовать</Link></Button>
          </div>
        </div>
      </section>
    </article>
  );
}
