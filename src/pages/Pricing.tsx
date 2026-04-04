import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Бесплатный',
    price: '0 BYN',
    period: '/мес',
    desc: 'Для знакомства с платформой',
    features: [
      'Поиск по базе НПА',
      'Просмотр документов',
      'Ограниченное количество запросов к AI',
    ],
    cta: 'Начать бесплатно',
    highlight: false,
  },
  {
    name: 'Профессиональный',
    price: '—',
    period: '/мес',
    desc: 'Для регулярной работы с законодательством',
    features: [
      'Всё из бесплатного тарифа',
      'Неограниченные запросы к AI',
      'Мониторинг изменений',
      'История редакций',
      'Приоритетная поддержка',
    ],
    cta: 'Скоро',
    highlight: true,
  },
  {
    name: 'Для команд',
    price: '—',
    period: '/мес',
    desc: 'Для компаний и отделов',
    features: [
      'Всё из профессионального тарифа',
      'Несколько пользователей',
      'Общие подписки на документы',
      'Управление доступом',
    ],
    cta: 'Скоро',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div>
      <section className="bg-primary px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">Тарифы</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Начните бесплатно. Перейдите на платный тариф, когда будете готовы.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                'flex flex-col',
                t.highlight && 'border-primary shadow-md ring-1 ring-primary/20'
              )}
            >
              <CardHeader>
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{t.price}</span>
                  <span className="text-sm text-muted-foreground">{t.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="flex-1 space-y-3 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild={t.name === 'Бесплатный'}
                  variant={t.highlight ? 'default' : 'outline'}
                  className="w-full"
                  disabled={t.name !== 'Бесплатный'}
                >
                  {t.name === 'Бесплатный' ? (
                    <Link to="/register">
                      {t.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    t.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Цены и состав тарифов могут измениться. Платёжная система ещё не подключена — 
          на данный момент доступен только бесплатный тариф.
        </p>
      </section>
    </div>
  );
}
