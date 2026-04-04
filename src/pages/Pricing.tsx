import { Link } from 'react-router-dom';
import { Check, Minus, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageSEO } from '@/components/shared/PageSEO';

const tiers = [
  {
    name: 'Бесплатный',
    price: '0 BYN',
    desc: 'Для знакомства с платформой и базовой работы с документами',
    highlight: false,
    ctaLabel: 'Начать бесплатно',
    ctaLink: '/register',
    ctaDisabled: false,
    features: [
      { text: 'Поиск по базе НПА', included: true },
      { text: 'Просмотр документов в структурированном виде', included: true },
      { text: 'История редакций документов', included: true },
      { text: 'До 10 запросов к AI-ассистенту в день', included: true, note: 'Лимит обновляется ежедневно' },
      { text: 'Уведомления об изменениях в документах', included: false },
      { text: 'Сравнение редакций', included: false },
      { text: 'Приоритетная обработка запросов', included: false },
    ],
  },
  {
    name: 'Про',
    price: '—',
    desc: 'Для регулярной профессиональной работы с законодательством',
    highlight: true,
    ctaLabel: 'Скоро',
    ctaLink: null,
    ctaDisabled: true,
    features: [
      { text: 'Всё из бесплатного тарифа', included: true },
      { text: 'Неограниченные запросы к AI-ассистенту', included: true },
      { text: 'Уведомления об изменениях в отслеживаемых документах', included: true },
      { text: 'Сравнение редакций документов', included: true },
      { text: 'Приоритетная обработка запросов', included: true },
      { text: 'Расширенные фильтры поиска', included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div>
      <PageSEO title="Тарифы" description="Бесплатный и профессиональный тарифы Право БY: доступ к документам, AI-ассистент, мониторинг изменений." path="/pricing" />
      <section className="bg-primary px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">Тарифы</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Начните работу бесплатно. Расширенные возможности будут доступны в тарифе «Про».
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                'flex flex-col',
                t.highlight && 'border-primary shadow-md ring-1 ring-primary/20'
              )}
            >
              <CardHeader>
                {t.highlight && (
                  <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                    Расширенный доступ
                  </span>
                )}
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{t.price}</span>
                  {t.price !== '—' && <span className="text-sm text-muted-foreground"> / мес</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="flex-1 space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={cn(!f.included && 'text-muted-foreground/60')}>
                        {f.text}
                        {f.note && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{f.note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild={!t.ctaDisabled}
                  variant={t.highlight ? 'default' : 'outline'}
                  className="w-full"
                  disabled={t.ctaDisabled}
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

        {/* Limits explanation */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-xl font-bold tracking-tight text-center">Подробнее об ограничениях</h2>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold">Доступ к документам</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Все пользователи имеют доступ к полнотекстовому поиску и просмотру документов 
                в структурированном виде. Бесплатный тариф включает доступ к основной базе НПА. 
                Тариф «Про» дополнительно включает сравнение редакций и расширенные фильтры.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Запросы к AI-ассистенту</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Бесплатный тариф позволяет отправлять до 10 запросов к AI-ассистенту в день. 
                Лимит обновляется каждые 24 часа. В тарифе «Про» количество запросов не ограничено.
                AI-ассистент не предоставляет юридических консультаций — ответы носят справочный характер.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Уведомления</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Уведомления об изменениях в отслеживаемых документах доступны только в тарифе «Про». 
                Вы сможете подписаться на интересующие НПА и получать оповещения при внесении поправок.
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mx-auto mt-12 max-w-2xl rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>
                Тарифы, цены и состав функций могут быть изменены. Указанная информация 
                не является публичной офертой и не создаёт обязательств. На данный момент 
                доступен только бесплатный тариф.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
