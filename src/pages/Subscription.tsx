import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PageSEO } from '@/components/shared/PageSEO';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Бесплатный',
    price: '0',
    period: '',
    features: ['26 кодексов', '200+ законов', 'Поиск', '5 AI-запросов/день', '5 документов/день'],
    cta: 'Начать',
  },
  {
    id: 'standard',
    name: 'Стандарт',
    price: '19',
    period: '/месяц',
    features: ['Все НПА', 'Закладки', 'Подписки', 'Email-уведомления', 'Без AI-лимита'],
    cta: 'Подключить',
  },
  {
    id: 'pro',
    name: 'Профи',
    price: '49',
    period: '/месяц',
    popular: true,
    features: ['Всё из Стандарт', 'AI без лимитов', 'История редакций', 'PDF скачивание', 'Приоритет поддержки'],
    cta: 'Подключить',
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: '149',
    period: '/месяц',
    features: ['Всё из Профи', '5 аккаунтов', 'API доступ', 'Приоритетная поддержка', 'Индивидуальные настройки'],
    cta: 'Подключить',
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [dialogPlan, setDialogPlan] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan, email, full_name, display_name').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setCurrentPlan(data.plan || 'free');
        setFormEmail(data.email || user.email || '');
        setFormName(data.full_name || data.display_name || '');
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogPlan) return;
    setSubmitting(true);
    const { error } = await supabase.from('subscription_requests').insert({
      user_id: user?.id,
      plan: dialogPlan,
      full_name: formName,
      email: formEmail,
      phone: formPhone,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: error.message });
    } else {
      toast({ title: 'Заявка отправлена', description: 'Мы свяжемся с вами для подключения тарифа' });
      setDialogPlan(null);
    }
  };

  const selectedPlanLabel = plans.find((p) => p.id === dialogPlan)?.name || '';

  return (
    <>
      <PageSEO title="Тарифы" description="Выберите подходящий тариф для работы с правовой базой Беларуси" path="/subscription" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Выберите тариф</h1>
          <p className="text-muted-foreground text-lg">Выберите план, подходящий для ваших задач</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col',
                  plan.popular && 'border-2 border-primary shadow-lg',
                  isCurrent && 'ring-2 ring-primary/50'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary text-primary-foreground"><Star className="h-3 w-3" />Популярный</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">BYN{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">Текущий тариф</Button>
                  ) : plan.id === 'free' ? (
                    <Button variant="outline" className="w-full" disabled>Начать</Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => {
                        if (!user) {
                          toast({ title: 'Войдите в аккаунт', description: 'Для подключения тарифа необходимо авторизоваться' });
                          return;
                        }
                        setDialogPlan(plan.id);
                      }}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!dialogPlan} onOpenChange={(open) => !open && setDialogPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подключение тарифа «{selectedPlanLabel}»</DialogTitle>
            <DialogDescription>Заполните форму и мы свяжемся с вами для подключения</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Иван Иванов" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+375 ..." />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Отмена</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>{submitting ? 'Отправка...' : 'Отправить заявку'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
