import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, ArrowRight, Scale, TrendingUp, TrendingDown,
  CalendarDays, FileText, Newspaper, Clock, Eye, Bot, Users,
} from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/* ──────────────────────────────────────────────
   Currency Rates Sidebar Widget
   ────────────────────────────────────────────── */

function CurrencyWidget() {
  const { data: rates, isLoading } = useQuery({
    queryKey: ['public-rates-widget'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('rate_date', today)
        .in('currency_code', ['USD', 'EUR', 'RUB', 'CNY'])
        .order('currency_code');
      if (!data || data.length === 0) {
        const { data: latest } = await supabase
          .from('currency_rates')
          .select('*')
          .in('currency_code', ['USD', 'EUR', 'RUB', 'CNY'])
          .order('rate_date', { ascending: false })
          .limit(4);
        return latest || [];
      }
      return data;
    },
  });

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            Курсы НБРБ
          </h3>
          <Link to="/rates" className="text-xs text-primary hover:underline">Все →</Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : rates && rates.length > 0 ? (
          <div className="space-y-2">
            {rates.map((r) => (
              <div key={r.currency_code} className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.currency_code}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                  {r.change_value !== null && r.change_value !== 0 && (
                    <span className={`flex items-center text-xs ${Number(r.change_value) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {Number(r.change_value) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {rates[0]?.rate_date && (
              <p className="text-xs text-muted-foreground mt-1">
                на {format(new Date(rates[0].rate_date), 'dd.MM.yyyy')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Курсы загружаются...</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
   Deadline Calendar Widget
   ────────────────────────────────────────────── */

function CalendarWidget() {
  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['public-deadlines-widget'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('deadline_calendar')
        .select('*')
        .gte('deadline_date', today)
        .order('deadline_date')
        .limit(4);
      return data || [];
    },
  });

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            Ближайшие сроки
          </h3>
          <Link to="/calendar" className="text-xs text-primary hover:underline">Все →</Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : deadlines && deadlines.length > 0 ? (
          <div className="space-y-2.5">
            {deadlines.map((d) => {
              const daysLeft = Math.ceil((new Date(d.deadline_date).getTime() - Date.now()) / 86400000);
              return (
                <div key={d.id} className="flex gap-2 items-start">
                  <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${daysLeft <= 7 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {format(new Date(d.deadline_date), 'dd.MM')}
                  </div>
                  <span className="text-xs leading-tight line-clamp-2">{d.title}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Нет ближайших сроков</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
   Quick service links sidebar (like ilex right panel)
   ────────────────────────────────────────────── */

function ServiceLinks() {
  const links = [
    { icon: Search, label: 'Поиск НПА', to: '/app/search' },
    { icon: Bot, label: 'AI-ассистент', to: '/app/assistant' },
    { icon: FileText, label: 'Все документы', to: '/documents' },
    { icon: Users, label: 'Эксперты', to: '/experts' },
  ];
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold mb-3">Сервисы</h3>
        <div className="space-y-1.5">
          {links.map(l => (
            <Link key={l.label} to={l.to} className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent transition-colors text-sm">
              <l.icon className="h-4 w-4 text-primary" />
              <span>{l.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
   Search Bar Hero (compact, ilex-style)
   ────────────────────────────────────────────── */

function SearchHero() {
  return (
    <section className="gradient-teal px-6 py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-foreground tracking-tight">
            Право<span className="opacity-80">&nbsp;БY</span>
          </h1>
        </div>
        <p className="text-primary-foreground/85 text-sm md:text-base max-w-2xl mb-6">
          Законодательство Беларуси, курсы валют, экспертные обзоры и AI-ассистент — в одном месте
        </p>
        <Link to="/app/search">
          <div className="flex items-center bg-white rounded-lg shadow-lg px-4 py-3 max-w-xl cursor-pointer hover:shadow-xl transition-shadow">
            <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
            <span className="text-muted-foreground text-sm">Поиск по законам, кодексам, указам...</span>
            <Button size="sm" className="ml-auto shrink-0">Найти</Button>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Latest documents section ("Коротко о главном")
   ────────────────────────────────────────────── */

function LatestDocuments() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ['public-latest-docs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, doc_type, doc_number, date_adopted, summary, source_url')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const docTypeLabel = (t: string) => {
    const map: Record<string, string> = { law: 'Закон', codex: 'Кодекс', decree: 'Указ', resolution: 'Постановление', order: 'Приказ' };
    return map[t] || t;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          Коротко о главном
        </h2>
        <Link to="/documents" className="text-sm text-primary hover:underline flex items-center gap-1">
          Все документы <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {docs?.map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}`}>
              <Card className="hover:shadow-md transition-shadow border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {docTypeLabel(doc.doc_type)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2">{doc.title}</h3>
                      {doc.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {doc.doc_number && <span>№ {doc.doc_number}</span>}
                        {doc.date_adopted && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(doc.date_adopted), 'dd.MM.yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────
   Latest articles section ("Эксперты рекомендуют")
   ────────────────────────────────────────────── */

function LatestArticles() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['public-latest-articles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, views, expert_id, experts(name)')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" /> Эксперты рекомендуют
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Эксперты рекомендуют
        </h2>
        <Link to="/news" className="text-sm text-primary hover:underline flex items-center gap-1">
          Все статьи <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {articles.map((a: any) => (
          <Link key={a.id} to={`/news/${a.slug}`}>
            <Card className="hover:shadow-md transition-shadow border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2">{a.title}</h3>
                {a.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {a.experts?.name && <span>{a.experts.name}</span>}
                  {a.published_at && (
                    <span>{format(new Date(a.published_at), 'dd.MM.yyyy')}</span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> {a.views}
                  </span>
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
   Popular documents ("Популярное")
   ────────────────────────────────────────────── */

function PopularTopics() {
  const { data: topics } = useQuery({
    queryKey: ['public-topics-widget'],
    queryFn: async () => {
      const { data } = await supabase
        .from('topics')
        .select('id, name, slug, document_count')
        .order('document_count', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  if (!topics || topics.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Популярные темы
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map(t => (
          <Link key={t.id} to={`/topics/${t.slug}`}>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-accent-foreground hover:bg-primary/10 transition-colors">
              {t.name}
              {t.document_count > 0 && <span className="text-muted-foreground">({t.document_count})</span>}
            </span>
          </Link>
        ))}
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
    description: 'Платформа правовой информации Республики Беларусь — законы, курсы валют, календарь сроков.',
    applicationCategory: 'ReferenceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BYN' },
  };

  return (
    <article>
      <PageSEO
        title="Право БY — законодательство Беларуси, курсы валют, аналитика"
        description="Поиск по НПА, курсы НБРБ, календарь дедлайнов, экспертные обзоры и AI-ассистент для бухгалтеров и юристов Беларуси."
        path="/"
        jsonLd={jsonLd}
      />

      <SearchHero />

      <div className="mx-auto max-w-6xl px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Main content */}
          <div className="space-y-10">
            <LatestDocuments />
            <LatestArticles />
            <PopularTopics />
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <CurrencyWidget />
            <CalendarWidget />
            <ServiceLinks />
          </aside>
        </div>
      </div>

      {/* Independence disclaimer */}
      <div className="border-t bg-muted/40 px-6 py-6">
        <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Право&nbsp;БY — независимый проект. Не является государственным информационным ресурсом
          и не связан с государственными органами Республики Беларусь.
          Информация носит справочный характер и не является юридической консультацией.
        </p>
      </div>
    </article>
  );
}
