import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { PageSEO } from '@/components/shared/PageSEO';

const tiers = [
  {
    name: 'Пробный',
    price: '0',
    desc: 'Для знакомства с сервисом',
    highlight: false,
    badge: null,
    ctaLabel: 'Начать',
    ctaLink: '/register',
    ctaVariant: 'outline' as const,
    features: [
      'Курсы валют НБРБ',
      'Календарь дедлайнов (текущий месяц)',
      'Новости и статьи',
      'Помощник — 3 вопроса',
    ],
  },
  {
    name: 'Персональный',
    price: '69',
    desc: 'Для физических лиц',
    highlight: true,
    badge: 'Популярный',
    ctaLabel: 'Оформить подписку',
    ctaLink: '/subscribe/personal',
    ctaVariant: 'default' as const,
    features: [
      'Все кодексы и законы — полный текст',
      'Поиск по статьям — безлимитно',
      'Калькуляторы — все',
      'Календарь — все месяцы',
      'Помощник — 30 вопросов/день',
      'Избранное и документы на контроле',
    ],
  },
  {
    name: 'Корпоративный',
    price: '99',
    desc: 'Для юридических лиц и ИП',
    highlight: false,
    badge: null,
    ctaLabel: 'Оформить подписку',
    ctaLink: '/subscribe/corporate',
    ctaVariant: 'default' as const,
    features: [
      'Всё из Персонального',
      'Помощник — безлимитно',
      'Экспорт PDF/DOCX',
      'Уведомления об изменениях в Telegram',
      'Приоритетная поддержка',
      'Акт и счёт-фактура для бухгалтерии',
    ],
  },
];

const comparisonFeatures = [
  { label: 'Кодексы и законы', free: 'Ограничено', personal: '∞', corp: '∞' },
  { label: 'Поиск по статьям', free: 'Ограничено', personal: '∞', corp: '∞' },
  { label: 'Помощник', free: '3/день', personal: '30/день', corp: '∞' },
  { label: 'Калькуляторы', free: false, personal: true, corp: true },
  { label: 'Календарь дедлайнов', free: 'Текущий месяц', personal: 'Все месяцы', corp: 'Все месяцы' },
  { label: 'Избранное и контроль', free: false, personal: true, corp: true },
  { label: 'Экспорт PDF/DOCX', free: false, personal: false, corp: true },
  { label: 'Telegram-уведомления', free: false, personal: false, corp: true },
  { label: 'Приоритетная поддержка', free: false, personal: false, corp: true },
  { label: 'Акт и счёт-фактура', free: false, personal: false, corp: true },
];

const faqItems = [
  {
    q: 'Как оплатить подписку?',
    a: 'Оплата производится банковской картой через защищённый платёжный шлюз. После оплаты доступ активируется автоматически. Для юридических лиц доступна оплата по счёту.',
  },
  {
    q: 'Можно ли отменить подписку?',
    a: 'Да, вы можете отменить подписку в любой момент в настройках аккаунта. Доступ сохраняется до конца оплаченного периода.',
  },
  {
    q: 'Есть ли пробный период?',
    a: 'Пробный тариф доступен без ограничений по времени. Вы можете пользоваться им и перейти на платный план, когда будете готовы.',
  },
  {
    q: 'Можно ли сменить тариф?',
    a: 'Да, вы можете перейти на более высокий тариф в любой момент. Разница в стоимости будет рассчитана пропорционально оставшемуся периоду.',
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}

export default function Pricing() {
  return (
    <div>
      <PageSEO
        title="Тарифы Бабиджон — Персональный 69 BYN, Корпоративный 99 BYN"
        description="Подписка на правовую базу РБ. Пробный доступ, персональный и корпоративный планы."
        path="/pricing"
      />

      <section className="bg-primary px-4 md:px-6 py-10 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground">Тарифы</h1>
          <p className="mt-2 md:mt-4 text-base md:text-lg text-primary-foreground/80">
            Выберите план, подходящий для ваших задач
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-4 md:px-6 py-8 md:py-16">
        <div className="mx-auto max-w-5xl grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3 items-start">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                'flex flex-col relative border',
                t.highlight && 'border-2 border-primary shadow-lg scale-[1.03] md:scale-105 z-10'
              )}
            >
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                    {t.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-sm text-muted-foreground"> BYN{t.price !== '0' ? '/мес' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="flex-1 space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild={!!t.ctaLink}
                  variant={t.ctaVariant}
                  className="w-full min-h-[44px]"
                >
                  {t.ctaLink ? (
                    <Link to={t.ctaLink}>
                      {t.ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    t.ctaLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-4 md:px-6 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-center mb-8">Сравнение тарифов</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Функция</th>
                  <th className="text-center py-3 px-4 font-medium">Пробный</th>
                  <th className="text-center py-3 px-4 font-medium text-primary">Персональный</th>
                  <th className="text-center py-3 px-4 font-medium">Корпоративный</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.label}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.free} /></td>
                    <td className="py-3 px-4 text-center bg-primary/5"><CellValue value={row.personal} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.corp} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-semibold text-center mb-8">Частые вопросы</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Notice */}
      <section className="px-4 md:px-6 pb-16">
        <div className="mx-auto max-w-2xl rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Тарифы, цены и состав функций могут быть изменены. Указанная информация
              не является публичной офертой.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
