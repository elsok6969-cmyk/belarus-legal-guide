import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageSEO } from '@/components/shared/PageSEO';
import { Search, ArrowRight, TrendingUp, TrendingDown, Minus, Check, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const quickTags = ['Трудовой кодекс', 'НДС', 'Трудовой договор', 'Увольнение', 'ФСЗН'];

const features = [
  {
    emoji: '📚',
    title: '26 кодексов РБ',
    desc: 'Полные тексты с навигацией по статьям и поиском внутри документа',
    link: '/documents?filter=codex',
    linkLabel: 'Открыть кодексы →',
  },
  {
    emoji: '🤖',
    title: 'AI-помощник',
    desc: 'Задайте вопрос — получите ответ со ссылками на конкретные статьи',
    link: '/app/assistant',
    linkLabel: 'Попробовать →',
  },
  {
    emoji: '📅',
    title: 'Календарь дедлайнов',
    desc: 'Налоговые и отчётные сроки с напоминаниями в Telegram',
    link: '/calendar',
    linkLabel: 'Открыть календарь →',
  },
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

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleTag = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/documents?q=${encodeURIComponent(tag)}`);
  };

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
        .order('deadline_date', { ascending: true }).limit(4);
      return data ?? [];
    },
  });

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Бабиджон',
    description: 'Законодательство Республики Беларусь онлайн',
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
      <section
        className="flex flex-col items-center justify-center px-6 py-20 md:py-32"
        style={{ minHeight: '70vh', background: 'hsl(var(--gray-50))' }}
      >
        <h1 className="text-center" style={{ maxWidth: 700 }}>
          Законодательство Беларуси — просто и понятно
        </h1>
        <p
          className="mt-4 text-center"
          style={{ fontSize: 20, color: 'hsl(var(--gray-600))', maxWidth: 600 }}
        >
          26 кодексов, AI-помощник, налоговый календарь
        </p>

        {/* Search bar */}
        <div
          className="mt-10 w-full flex items-center"
          style={{
            maxWidth: 600,
            background: 'white',
            border: '2px solid hsl(var(--gray-200))',
            borderRadius: 16,
            height: 56,
            paddingLeft: 20,
            paddingRight: 6,
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--amber-500))';
            e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--amber-50))';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--gray-200))';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Search className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--gray-400))' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Найдите кодекс, закон, указ..."
            className="flex-1 bg-transparent px-3 text-base outline-none"
            style={{ fontSize: 17, color: 'hsl(var(--gray-900))' }}
          />
          <button
            onClick={handleSearch}
            className="btn-primary shrink-0"
            style={{ padding: '8px 24px', borderRadius: 12 }}
          >
            Найти
          </button>
        </div>

        {/* Quick tags */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTag(tag)}
              className="transition-all duration-200"
              style={{
                padding: '6px 16px',
                fontSize: 13,
                borderRadius: 980,
                border: '1px solid hsl(var(--gray-200))',
                background: 'transparent',
                color: 'hsl(var(--gray-600))',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--gray-900))';
                e.currentTarget.style.borderColor = 'hsl(var(--gray-400))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--gray-600))';
                e.currentTarget.style.borderColor = 'hsl(var(--gray-200))';
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-20 md:py-24" style={{ background: 'white' }}>
        <div className="container-apple text-center">
          <h2>Всё для работы с законодательством</h2>
          <p className="mt-3" style={{ color: 'hsl(var(--gray-600))', fontSize: 17 }}>
            Инструменты для бухгалтеров, юристов и предпринимателей
          </p>
          <div className="grid gap-6 sm:grid-cols-3 mt-12">
            {features.map((f) => (
              <div key={f.title} className="card-apple text-left">
                <span style={{ fontSize: 32 }}>{f.emoji}</span>
                <h3 className="mt-4">{f.title}</h3>
                <p className="mt-2" style={{ fontSize: 15, color: 'hsl(var(--gray-600))', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
                <Link
                  to={f.link}
                  className="inline-block mt-4 text-sm font-medium transition-colors"
                  style={{ color: 'hsl(var(--navy-600))' }}
                >
                  {f.linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RATES ═══ */}
      {rates && rates.length > 0 && (
        <section style={{ background: 'hsl(var(--gray-50))' }} className="py-6">
          <div className="container-apple flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 flex-wrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {rates.map((r) => {
                const change = Number(r.change_value) || 0;
                const pct = r.rate ? ((change / r.rate) * 100).toFixed(2) : '0';
                return (
                  <span key={r.currency_code} className="flex items-center gap-2 text-sm">
                    <span className="font-medium" style={{ color: 'hsl(var(--gray-900))' }}>
                      {r.currency_code === 'RUB' ? 'RUB/100' : r.currency_code}
                    </span>
                    <span className="font-semibold" style={{ color: 'hsl(var(--gray-900))' }}>
                      {Number(r.rate).toFixed(4)}
                    </span>
                    <span
                      className="flex items-center text-xs"
                      style={{
                        color: change > 0 ? 'hsl(var(--green-text))' : change < 0 ? 'hsl(var(--red-text))' : 'hsl(var(--gray-400))',
                      }}
                    >
                      {change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : change < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                      {change !== 0 ? `${Math.abs(Number(pct))}%` : '—'}
                    </span>
                  </span>
                );
              })}
            </div>
            <Link
              to="/rates"
              className="text-sm font-medium transition-colors"
              style={{ color: 'hsl(var(--navy-600))' }}
            >
              Все курсы →
            </Link>
          </div>
        </section>
      )}

      {/* ═══ DEADLINES ═══ */}
      {deadlines && deadlines.length > 0 && (
        <section className="py-20 md:py-24" style={{ background: 'white' }}>
          <div className="container-apple">
            <h2>Ближайшие дедлайны</h2>
            <div className="mt-10 space-y-0">
              {deadlines.map((d, i) => (
                <div key={d.id} className="flex items-start gap-4 py-4">
                  <div className="flex flex-col items-center shrink-0" style={{ width: 16 }}>
                    <div
                      className="rounded-full"
                      style={{
                        width: 10,
                        height: 10,
                        background: 'hsl(var(--amber-500))',
                        marginTop: 6,
                      }}
                    />
                    {i < deadlines.length - 1 && (
                      <div
                        className="flex-1"
                        style={{
                          width: 2,
                          minHeight: 24,
                          background: 'hsl(var(--gray-200))',
                          marginTop: 4,
                        }}
                      />
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
            <div className="mt-8">
              <Link to="/calendar" className="btn-secondary">
                Открыть календарь →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ PRICING ═══ */}
      <section className="py-20 md:py-24" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="container-apple text-center">
          <h2>Простые и честные тарифы</h2>
          <p className="mt-3" style={{ color: 'hsl(var(--gray-600))' }}>
            Все кодексы и 200+ законов — бесплатно, без регистрации
          </p>
          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto mt-12">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="card-apple relative text-left"
                style={plan.popular ? { border: '2px solid hsl(var(--amber-500))' } : {}}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{
                        background: 'hsl(var(--amber-500))',
                        color: 'hsl(var(--navy-900))',
                        padding: '4px 14px',
                        borderRadius: 980,
                      }}
                    >
                      <Star className="h-3 w-3" /> Популярный
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3>{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold" style={{ color: 'hsl(var(--gray-900))' }}>
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: 'hsl(var(--gray-600))' }}>
                      {' '}BYN{plan.price !== '0' ? '/мес' : ''}
                    </span>
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
                <Link
                  to={plan.to}
                  className={`w-full text-center block ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
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
