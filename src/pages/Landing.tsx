import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageSEO } from '@/components/shared/PageSEO';
import { Search, ArrowRight, TrendingUp, TrendingDown, Minus, Check, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const quickTags = ['Трудовой кодекс', 'НДС', 'Трудовой договор', 'Увольнение', 'ФСЗН'];

const codexList = [
  { emoji: '⚖️', name: 'Гражданский кодекс', search: 'Гражданский кодекс' },
  { emoji: '💰', name: 'Налоговый кодекс (Общая часть)', search: 'Налоговый кодекс Общая часть' },
  { emoji: '💰', name: 'Налоговый кодекс (Особенная часть)', search: 'Налоговый кодекс Особенная часть' },
  { emoji: '👷', name: 'Трудовой кодекс', search: 'Трудовой кодекс' },
  { emoji: '🔒', name: 'Уголовный кодекс', search: 'Уголовный кодекс' },
  { emoji: '🏛', name: 'КоАП', search: 'Кодекс об административных правонарушениях' },
  { emoji: '👨‍👩‍👧', name: 'Кодекс о браке и семье', search: 'Кодекс о браке и семье' },
  { emoji: '🏠', name: 'Жилищный кодекс', search: 'Жилищный кодекс' },
];

const featuresGrid = [
  { emoji: '🔍', title: 'Умный поиск', desc: 'Полнотекстовый поиск по всей базе документов с подсветкой результатов' },
  { emoji: '📑', title: 'Фокус на статье', desc: 'Кликните на статью в оглавлении — увидите только её, без лишнего текста' },
  { emoji: '🤖', title: 'AI-помощник', desc: 'Задайте вопрос на обычном языке — получите ответ со ссылкой на статью' },
  { emoji: '🔗', title: 'Связи между статьями', desc: 'Кликабельные ссылки: «см. ст. 45» → сразу переход к статье 45' },
  { emoji: '📅', title: 'Календарь дедлайнов', desc: 'Налоговые сроки с напоминаниями. Никогда не пропустите отчёт' },
  { emoji: '💱', title: 'Курсы и показатели', desc: 'Курсы НБРБ, ставка рефинансирования, МЗП — всегда актуальные' },
];

const flagMap: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳', PLN: '🇵🇱', UAH: '🇺🇦', GBP: '🇬🇧',
};

const professions = [
  { emoji: '👨‍💼', label: 'Бухгалтер', desc: 'Налоговый кодекс, калькуляторы, формы отчётности' },
  { emoji: '⚖️', label: 'Юрист', desc: 'Гражданский и уголовный кодексы, судебная практика' },
  { emoji: '👷', label: 'Кадровик', desc: 'Трудовой кодекс, кадровые формы, увольнение' },
  { emoji: '🛒', label: 'Закупки', desc: 'Закон о госзакупках, типовые формы, документы' },
  { emoji: '💹', label: 'Экономист', desc: 'Экономические показатели, курсы, калькуляторы' },
  { emoji: '🏗', label: 'Строитель', desc: 'Строительные нормы, лицензирование, безопасность' },
];

const pricingPlans = [
  {
    name: 'Бесплатный', price: '0',
    features: ['26 кодексов РБ', '3 AI-запроса/день', 'Курсы НБРБ и календарь'],
    cta: 'Начать бесплатно', to: '/auth', popular: false,
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

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'завтра';
  const last = diff % 10;
  const lastTwo = diff % 100;
  let word = 'дней';
  if (last === 1 && lastTwo !== 11) word = 'день';
  else if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) word = 'дня';
  return `через ${diff} ${word}`;
}

function MiniSparkline({ data, color = 'hsl(var(--amber-500))' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 30;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredProf, setHoveredProf] = useState<number | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
  };
  const handleTag = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/documents?q=${encodeURIComponent(tag)}`);
  };

  // Economic indicators
  const { data: indicators } = useQuery({
    queryKey: ['landing-indicators'],
    queryFn: async () => {
      const { data } = await supabase.from('economic_indicators').select('*');
      return data ?? [];
    },
  });

  // Currency rates (latest per code)
  const { data: rates } = useQuery({
    queryKey: ['landing-rates-v2'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, currency_name, rate, change_value, rate_date')
        .in('currency_code', ['USD', 'EUR', 'RUB', 'CNY'])
        .order('rate_date', { ascending: false }).limit(4);
      return data ?? [];
    },
  });

  // Currency history for sparklines (last 7 entries per code)
  const { data: rateHistory } = useQuery({
    queryKey: ['landing-rate-history'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, rate, rate_date')
        .in('currency_code', ['USD', 'EUR', 'RUB', 'CNY'])
        .order('rate_date', { ascending: true })
        .limit(100);
      const grouped: Record<string, number[]> = {};
      (data ?? []).forEach((r) => {
        if (!grouped[r.currency_code]) grouped[r.currency_code] = [];
        grouped[r.currency_code].push(Number(r.rate));
      });
      // Keep last 7 per code
      Object.keys(grouped).forEach((k) => { grouped[k] = grouped[k].slice(-7); });
      return grouped;
    },
  });

  // Latest documents
  const { data: latestDocs } = useQuery({
    queryKey: ['landing-latest-docs'],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_date, document_type_id, document_types(name_ru)')
        .order('created_at', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  // Deadlines
  const { data: deadlines } = useQuery({
    queryKey: ['landing-deadlines'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('deadline_calendar')
        .select('id, title, deadline_date')
        .gte('deadline_date', today)
        .order('deadline_date', { ascending: true }).limit(6);
      return data ?? [];
    },
  });

  const getIndicator = (slug: string) => indicators?.find((i) => i.slug === slug);
  const refRate = getIndicator('refinancing-rate');
  const minWage = getIndicator('minimum-wage');
  const baseAmount = getIndicator('base-amount');
  const usdRate = rates?.find((r) => r.currency_code === 'USD');
  const eurRate = rates?.find((r) => r.currency_code === 'EUR');

  const websiteJsonLd = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: 'Бабиджон', description: 'Законодательство Республики Беларусь онлайн', inLanguage: 'ru',
  };

  return (
    <article>
      <PageSEO
        title="Законодательство Беларуси онлайн"
        description="Полные тексты 26 кодексов и 200+ законов Беларуси бесплатно. Поиск по НПА, налоговый календарь, AI-ассистент для бухгалтеров и юристов."
        path="/" jsonLd={[websiteJsonLd]}
      />

      {/* ═══ HERO ═══ */}
      <section
        className="flex flex-col items-center justify-center px-6 py-20 md:py-32"
        style={{ minHeight: '70vh', background: 'hsl(var(--gray-50))' }}
      >
        <h1 className="text-center" style={{ maxWidth: 700 }}>
          Законодательство Беларуси — просто и понятно
        </h1>
        <p className="mt-4 text-center" style={{ fontSize: 20, color: 'hsl(var(--gray-600))', maxWidth: 600 }}>
          26 кодексов, AI-помощник, налоговый календарь
        </p>
        <div
          className="mt-10 w-full flex items-center"
          style={{
            maxWidth: 600, background: 'white', border: '2px solid hsl(var(--gray-200))',
            borderRadius: 16, height: 56, paddingLeft: 20, paddingRight: 6, transition: 'all 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--amber-50))'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Search className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--gray-400))' }} />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Найдите кодекс, закон, указ..."
            className="flex-1 bg-transparent px-3 text-base outline-none"
            style={{ fontSize: 17, color: 'hsl(var(--gray-900))' }}
          />
          <button onClick={handleSearch} className="btn-primary shrink-0" style={{ padding: '8px 24px', borderRadius: 12 }}>
            Найти
          </button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {quickTags.map((tag) => (
            <button
              key={tag} onClick={() => handleTag(tag)}
              className="transition-all duration-200"
              style={{ padding: '6px 16px', fontSize: 13, borderRadius: 980, border: '1px solid hsl(var(--gray-200))', background: 'transparent', color: 'hsl(var(--gray-600))', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--gray-900))'; e.currentTarget.style.borderColor = 'hsl(var(--gray-400))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--gray-600))'; e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ INFORMERS BAR ═══ */}
      <section style={{ background: 'hsl(var(--navy-900))' }} className="py-3">
        <div className="container-apple overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {refRate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col cursor-default">
                    <span style={{ fontSize: 11, opacity: 0.6, color: 'white' }}>Ставка рефинансирования</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{refRate.current_value}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Обновлено: {formatDate(refRate.effective_date)}</TooltipContent>
              </Tooltip>
            )}
            {minWage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col cursor-default" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24 }}>
                    <span style={{ fontSize: 11, opacity: 0.6, color: 'white' }}>МЗП</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{minWage.current_value} BYN</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Обновлено: {formatDate(minWage.effective_date)}</TooltipContent>
              </Tooltip>
            )}
            {baseAmount && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col cursor-default" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24 }}>
                    <span style={{ fontSize: 11, opacity: 0.6, color: 'white' }}>Базовая величина</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{baseAmount.current_value} BYN</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Обновлено: {formatDate(baseAmount.effective_date)}</TooltipContent>
              </Tooltip>
            )}
            {usdRate && (
              <Link to="/currencies" className="flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24, textDecoration: 'none' }}>
                <span style={{ fontSize: 11, opacity: 0.6, color: 'white' }}>USD</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{Number(usdRate.rate).toFixed(4)}</span>
              </Link>
            )}
            {eurRate && (
              <Link to="/currencies" className="flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24, textDecoration: 'none' }}>
                <span style={{ fontSize: 11, opacity: 0.6, color: 'white' }}>EUR</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{Number(eurRate.rate).toFixed(4)}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══ POPULAR DOCUMENTS ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'white' }}>
        <div className="container-apple">
          <h2>Популярные документы</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-5">
            {/* Left: Codexes */}
            <div className="md:col-span-3">
              <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 500, color: 'hsl(var(--gray-400))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Кодексы РБ</h3>
              <div>
                {codexList.map((c) => (
                  <Link
                    key={c.name} to={`/documents?q=${encodeURIComponent(c.search)}`}
                    className="flex items-center gap-3 py-3.5 transition-colors"
                    style={{ borderBottom: '1px solid hsl(var(--gray-100))', color: 'hsl(var(--gray-900))', textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--gray-50))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <span className="flex-1 font-medium" style={{ fontSize: 15 }}>{c.name}</span>
                    <ArrowRight className="h-4 w-4" style={{ color: 'hsl(var(--gray-400))' }} />
                  </Link>
                ))}
              </div>
              <Link to="/documents?filter=codex" className="inline-block mt-4 text-sm font-medium" style={{ color: 'hsl(var(--navy-600))' }}>
                Все 26 кодексов →
              </Link>
            </div>

            {/* Right: Latest docs */}
            <div className="md:col-span-2">
              <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 500, color: 'hsl(var(--gray-400))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Последние документы</h3>
              <div className="space-y-3">
                {(latestDocs ?? []).map((doc: any) => (
                  <Link
                    key={doc.id} to={`/documents/${doc.id}`}
                    className="block card-apple"
                    style={{ padding: '12px 16px', textDecoration: 'none' }}
                  >
                    {doc.document_types?.name_ru && (
                      <span className="badge-codex" style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}>
                        {doc.document_types.name_ru}
                      </span>
                    )}
                    <p className="font-medium" style={{ fontSize: 14, color: 'hsl(var(--navy-700))', lineHeight: 1.4 }}>
                      {doc.title?.length > 60 ? doc.title.slice(0, 60) + '…' : doc.title}
                    </p>
                    <span style={{ fontSize: 13, color: 'hsl(var(--gray-400))' }}>{formatDate(doc.doc_date)}</span>
                  </Link>
                ))}
                {(!latestDocs || latestDocs.length === 0) && (
                  <p style={{ fontSize: 14, color: 'hsl(var(--gray-400))' }}>Документы загружаются…</p>
                )}
              </div>
              <Link to="/documents" className="inline-block mt-4 text-sm font-medium" style={{ color: 'hsl(var(--navy-600))' }}>
                Все документы →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES 2x3 ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="container-apple text-center">
          <h2>Чем Бабиджон лучше</h2>
          <p className="mt-3" style={{ color: 'hsl(var(--gray-600))', fontSize: 17 }}>
            Инструменты для бухгалтеров, юристов и предпринимателей
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {featuresGrid.map((f) => (
              <div key={f.title} className="card-apple text-left">
                <span style={{ fontSize: 32 }}>{f.emoji}</span>
                <h3 className="mt-4">{f.title}</h3>
                <p className="mt-2" style={{ fontSize: 15, color: 'hsl(var(--gray-600))', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CURRENCY CARDS ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'white' }}>
        <div className="container-apple">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2>Курсы валют НБРБ</h2>
              <p className="mt-1" style={{ fontSize: 14, color: 'hsl(var(--gray-400))' }}>Обновляются ежедневно</p>
            </div>
          </div>
          {rates && rates.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rates.map((r) => {
                const change = Number(r.change_value) || 0;
                const pct = r.rate ? ((change / Number(r.rate)) * 100).toFixed(2) : '0';
                const sparkData = rateHistory?.[r.currency_code] ?? [];
                return (
                  <div key={r.currency_code} className="card-apple" style={{ padding: '20px 24px' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: 24 }}>{flagMap[r.currency_code] || '🏳️'}</span>
                      <span className="font-medium" style={{ fontSize: 14, color: 'hsl(var(--gray-600))' }}>
                        {r.currency_code === 'RUB' ? 'RUB/100' : r.currency_code}
                      </span>
                    </div>
                    <div className="font-semibold" style={{ fontSize: 24, color: 'hsl(var(--navy-900))', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(r.rate).toFixed(4)} <span style={{ fontSize: 14, fontWeight: 400, color: 'hsl(var(--gray-400))' }}>BYN</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1" style={{ fontSize: 13, color: change > 0 ? 'hsl(var(--green-text))' : change < 0 ? 'hsl(var(--red-text))' : 'hsl(var(--gray-400))' }}>
                      {change > 0 ? '▲' : change < 0 ? '▼' : '—'}
                      {change !== 0 && ` ${change > 0 ? '+' : ''}${change.toFixed(4)} (${Math.abs(Number(pct))}%)`}
                    </div>
                    {sparkData.length > 1 && (
                      <div className="mt-3">
                        <MiniSparkline data={sparkData} color={change >= 0 ? 'hsl(var(--green-text))' : 'hsl(var(--red-text))'} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'hsl(var(--gray-400))' }}>Курсы временно недоступны</p>
          )}
          <div className="mt-8 text-center">
            <Link to="/currencies" className="btn-secondary">Все курсы и конвертер →</Link>
          </div>
        </div>
      </section>

      {/* ═══ DEADLINES ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="container-apple">
          <h2>Ближайшие дедлайны</h2>
          {deadlines && deadlines.length > 0 ? (
            <div className="mt-10 space-y-0">
              {deadlines.map((d, i) => (
                <div key={d.id} className="flex items-start gap-4 py-4">
                  <div className="flex flex-col items-center shrink-0" style={{ width: 16 }}>
                    <div className="rounded-full" style={{ width: 10, height: 10, background: 'hsl(var(--amber-500))', marginTop: 6 }} />
                    {i < deadlines.length - 1 && (
                      <div className="flex-1" style={{ width: 2, minHeight: 24, background: 'hsl(var(--gray-200))', marginTop: 4 }} />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <span className="font-medium text-base" style={{ color: 'hsl(var(--gray-900))' }}>
                      {formatDate(d.deadline_date)} — {d.title}
                    </span>
                    <span className="text-sm shrink-0" style={{ color: 'hsl(var(--gray-400))' }}>
                      {daysUntil(d.deadline_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6" style={{ fontSize: 14, color: 'hsl(var(--gray-400))' }}>Нет ближайших дедлайнов</p>
          )}
          <div className="mt-8">
            <Link to="/calendar" className="btn-secondary">Открыть календарь →</Link>
          </div>
        </div>
      </section>

      {/* ═══ FOR WHOM ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'white' }}>
        <div className="container-apple text-center">
          <h2>Для профессионалов</h2>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {professions.map((p, i) => (
              <Link
                key={p.label}
                to={`/app/guide`}
                className="relative transition-all duration-200"
                style={{
                  padding: '10px 24px', borderRadius: 980, fontSize: 15, fontWeight: 500,
                  border: '1.5px solid hsl(var(--gray-200))', color: 'hsl(var(--navy-900))',
                  background: hoveredProf === i ? 'hsl(var(--navy-900))' : 'transparent',
                  ...(hoveredProf === i ? { color: 'white', borderColor: 'hsl(var(--navy-900))' } : {}),
                  textDecoration: 'none',
                }}
                onMouseEnter={() => setHoveredProf(i)}
                onMouseLeave={() => setHoveredProf(null)}
              >
                {p.emoji} {p.label}
              </Link>
            ))}
          </div>
          {hoveredProf !== null && (
            <p className="mt-4 transition-opacity" style={{ fontSize: 14, color: 'hsl(var(--gray-600))' }}>
              {professions[hoveredProf].desc}
            </p>
          )}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-16 md:py-20" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="container-apple text-center">
          <h2>Простые и честные тарифы</h2>
          <p className="mt-3" style={{ color: 'hsl(var(--gray-600))' }}>
            Все кодексы и 200+ законов — бесплатно, без регистрации
          </p>
          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto mt-12">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name} className="card-apple relative text-left"
                style={plan.popular ? { border: '2px solid hsl(var(--amber-500))' } : {}}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ background: 'hsl(var(--amber-500))', color: 'hsl(var(--navy-900))', padding: '4px 14px', borderRadius: 980 }}>
                      <Star className="h-3 w-3" /> Популярный
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3>{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold" style={{ color: 'hsl(var(--gray-900))' }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: 'hsl(var(--gray-600))' }}> BYN{plan.price !== '0' ? '/мес' : ''}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(var(--amber-500))' }} />
                      <span style={{ color: 'hsl(var(--gray-700))' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.to} className={`w-full text-center block ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
