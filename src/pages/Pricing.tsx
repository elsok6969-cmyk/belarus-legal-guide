import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageSEO } from '@/components/shared/PageSEO';

const tiers = [
  {
    name: 'Бесплатный', price: '0',
    desc: 'Для знакомства с платформой',
    highlight: false, badge: null,
    ctaLabel: 'Текущий план', ctaLink: null,
    features: ['26 кодексов РБ — полный доступ', 'Поиск по документам — до 10 запросов/день', 'AI-помощник — 3 вопроса/день', 'Календарь дедлайнов', 'Курсы валют НБРБ'],
  },
  {
    name: 'Базовый', price: '29',
    desc: 'Для регулярной работы с документами',
    highlight: true, badge: 'Популярный',
    ctaLabel: 'Выбрать план', ctaLink: '/subscribe/basic',
    features: ['Всё из бесплатного', 'Все законы, указы, постановления', 'Поиск — безлимитно', 'AI-помощник — 30 вопросов/день', 'Избранное — до 100 документов', 'Документы на контроле — до 5', 'Email-рассылка изменений'],
  },
  {
    name: 'Про', price: '59',
    desc: 'Для профессионалов',
    highlight: false, badge: null,
    ctaLabel: 'Выбрать план', ctaLink: '/subscribe/pro',
    features: ['Всё из базового', 'AI-помощник — безлимитно', 'Калькуляторы — все', 'Экспорт в PDF/DOCX', 'Telegram-уведомления', 'Приоритетная поддержка'],
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
  { q: 'Как оплатить подписку?', a: 'Оплата производится банковской картой через защищённый платёжный шлюз. После оплаты доступ активируется автоматически. Для юридических лиц доступна оплата по счёту.' },
  { q: 'Можно ли отменить подписку?', a: 'Да, вы можете отменить подписку в любой момент в настройках аккаунта. Доступ сохраняется до конца оплаченного периода.' },
  { q: 'Есть ли пробный период?', a: 'Бесплатный тариф доступен без ограничений по времени. Вы можете пользоваться им сколько угодно и перейти на платный план, когда будете готовы.' },
  { q: 'Можно ли сменить тариф?', a: 'Да, вы можете перейти на более высокий тариф в любой момент. Разница в стоимости будет рассчитана пропорционально оставшемуся периоду.' },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 mx-auto" style={{ color: 'hsl(var(--green-text))' }} />;
  if (value === false) return <X className="h-4 w-4 mx-auto" style={{ color: 'hsl(var(--gray-400))' }} />;
  return <span className="text-sm">{value}</span>;
}

export default function Pricing() {
  return (
    <div>
      <PageSEO title="Тарифы — Бабиджон" description="Три тарифа для работы с законодательством Беларуси: бесплатный, базовый (29 BYN/мес) и про (59 BYN/мес)." path="/pricing" />

      <section className="py-20" style={{ background: 'hsl(var(--navy-900))' }}>
        <div className="container-apple text-center">
          <h1 style={{ color: 'white' }}>Тарифы</h1>
          <p className="mt-4" style={{ fontSize: 18, color: 'hsl(var(--navy-300))' }}>
            Выберите план, подходящий для ваших задач
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-apple">
          <div className="grid gap-8 md:grid-cols-3 items-start max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div
                key={t.name}
                className="card-apple relative flex flex-col"
                style={t.highlight ? { border: '2px solid hsl(var(--amber-500))' } : {}}
              >
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center text-xs font-medium"
                      style={{ background: 'hsl(var(--amber-50))', color: 'hsl(var(--amber-800))', padding: '4px 14px', borderRadius: 980 }}
                    >
                      {t.badge}
                    </span>
                  </div>
                )}
                <div className="text-center pb-4">
                  <h3>{t.name}</h3>
                  <p className="mt-1" style={{ fontSize: 14, color: 'hsl(var(--gray-600))' }}>{t.desc}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" style={{ color: 'hsl(var(--gray-900))' }}>{t.price}</span>
                    <span className="text-sm" style={{ color: 'hsl(var(--gray-600))' }}> BYN{t.price !== '0' ? '/мес' : ''}</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'hsl(var(--amber-500))' }} />
                      <span style={{ color: 'hsl(var(--gray-700))' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                {t.ctaLink ? (
                  <Link to={t.ctaLink} className={`w-full text-center block ${t.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                    {t.ctaLabel}
                  </Link>
                ) : (
                  <span className="btn-ghost w-full text-center block cursor-default" style={{ opacity: 0.5 }}>{t.ctaLabel}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="container-apple max-w-4xl">
          <h2 className="text-center mb-8">Сравнение тарифов</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--gray-200))' }}>
                  <th className="text-left py-3 px-4 font-medium">Функция</th>
                  <th className="text-center py-3 px-4 font-medium">Бесплатный</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'hsl(var(--amber-600))' }}>Базовый</th>
                  <th className="text-center py-3 px-4 font-medium">Про</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid hsl(var(--gray-200))' }}>
                    <td className="py-3 px-4">{row.label}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.free} /></td>
                    <td className="py-3 px-4 text-center" style={{ background: 'hsl(var(--amber-50) / 0.3)' }}><CellValue value={row.basic} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-apple max-w-2xl">
          <h2 className="text-center mb-8">Частые вопросы</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent style={{ color: 'hsl(var(--gray-600))' }}>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-apple max-w-2xl">
          <div className="card-apple flex items-start gap-3 text-sm" style={{ color: 'hsl(var(--gray-600))' }}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Тарифы, цены и состав функций могут быть изменены. Указанная информация не является публичной офертой.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
