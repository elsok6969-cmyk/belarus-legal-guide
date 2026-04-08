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
    name: 'Бесплатный',
    price: '0',
    desc: 'Для знакомства с платформой',
    highlight: false,
    badge: null,
    ctaLabel: 'Текущий план',
    ctaLink: null,
    ctaVariant: 'outline' as const,
    features: [
      '26 кодексов РБ — полный доступ',
      'Поиск по документам — до 10 запросов/день',
      'AI-помощник — 3 вопроса/день',
      'Календарь дедлайнов',
      'Курсы валют НБРБ',
    ],
  },
  {
    name: 'Базовый',
    price: '29',
    desc: 'Для регулярной работы с документами',
    highlight: true,
    badge: 'Популярный',
    ctaLabel: 'Выбрать план',
    ctaLink: '/subscribe/basic',
    ctaVariant: 'default' as const,
    features: [
      'Всё из бесплатного',
      'Все законы, указы, постановления',
      'Поиск — безлимитно',
      'AI-помощник — 30 вопросов/день',
      'Избранное — до 100 документов',
      'Документы на контроле — до 5',
      'Email-рассылка изменений',
    ],
  },
  {
    name: 'Про',
    price: '59',
    desc: 'Для профессионалов',
    highlight: false,
    badge: null,
    ctaLabel: 'Выбрать план',
    ctaLink: '/subscribe/pro',
    ctaVariant: 'secondary' as const,
    features: [
      'Всё из базового',
      'AI-помощник — безлимитно',
      'Калькуляторы — все',
      'Экспорт в PDF/DOCX',
      'Telegram-уведомления',
      'Приоритетная поддержка',
    ],
  },
];

const comparisonFeatures = [
  { label: 'Кодексы РБ', free: true, basic: true, pro: true },
  { label: 'Законы, указы, постановления', free: false, basic: true, pro: true },
  { label: 'Полнотекстовый поиск', free: '10/день', basic: '∞', pro: '∞' },
  { label: 'AI-помощник', free: '3/день', basic: '30/день', pro: '∞' },
  { label: 'Избранное', free: false, basic: '100 док.', pro: '∞' },
  { label: 'Документы на контроле', free: false, basic: '5 док.', pro: '∞' },
  { label: 'Email-уведомления', free: false, basic: true, pro: true },
  { label: 'Telegram-уведомления', free: false, basic: false, pro: true },
  { label: 'Калькуляторы', free: 'Базовые', basic: 'Базовые', pro: 'Все' },
  { label: 'Экспорт PDF/DOCX', free: false, basic: false, pro: true },
  { label: 'Приоритетная поддержка', free: false, basic: false, pro: true },
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
    a: 'Бесплатный тариф доступен без ограничений по времени. Вы можете пользоваться им сколько угодно и перейти на платный план, когда будете готовы.',
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
        title="Тарифы — Правовой помощник"
        description="Три тарифа для работы с законодательством Беларуси: бесплатный, базовый (29 BYN/мес) и про (59 BYN/мес)."
        path="/pricing"
      />

      <section className="bg-primary px-4 md:px-6 py-10 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-primary-foreground">Тарифы</h1>
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
                'flex flex-col relative',
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
                  className={cn('w-full', !t.ctaLink && 'cursor-default')}
                  disabled={!t.ctaLink}
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
      <section className="px-6 py-12 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Сравнение тарифов</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Функция</th>
                  <th className="text-center py-3 px-4 font-medium">Бесплатный</th>
                  <th className="text-center py-3 px-4 font-medium text-primary">Базовый</th>
                  <th className="text-center py-3 px-4 font-medium">Про</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.label}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.free} /></td>
                    <td className="py-3 px-4 text-center bg-primary/5"><CellValue value={row.basic} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-8">Частые вопросы</h2>
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
      <section className="px-6 pb-16">
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
