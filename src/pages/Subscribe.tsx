import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, CheckCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PlanInfo {
  name: string;
  price: string;
  features: string[];
}

const plans: Record<string, PlanInfo> = {
  personal: {
    name: 'Персональный',
    price: '69 BYN/мес',
    features: [
      'Полный доступ к базе НПА',
      'AI-ассистент — 30 запросов/день',
      'Закладки и история просмотров',
      'Уведомления об изменениях',
      'Калькуляторы и формы',
    ],
  },
  corporate: {
    name: 'Корпоративный',
    price: '99 BYN/мес',
    features: [
      'Всё из Персонального',
      'AI-ассистент — без лимита',
      'До 5 пользователей',
      'Приоритетная поддержка',
      'Экспорт документов',
      'Налоговый календарь с напоминаниями',
    ],
  },
};

// Legacy slug mapping
const slugMap: Record<string, string> = {
  basic: 'personal',
  pro: 'corporate',
  professional: 'corporate',
};

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  organization: string;
}

export default function Subscribe() {
  const { plan: rawPlan } = useParams<{ plan: string }>();
  const plan = rawPlan ? (slugMap[rawPlan] || rawPlan) : '';
  const info = plan ? plans[plan] : undefined;
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      email: user?.email || '',
      full_name: '',
      phone: '',
      organization: '',
    },
  });

  if (!info) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-muted-foreground">План не найден</p>
        <Button asChild><Link to="/pricing">К тарифам</Link></Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Для оформления подписки необходимо войти в аккаунт');
      return;
    }
    const { error } = await supabase.from('subscription_requests').insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      plan,
      user_id: user.id,
    });
    if (error) {
      toast.error('Ошибка при отправке заявки');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Спасибо, заявка отправлена!</h1>
        <p className="text-muted-foreground">
          Мы свяжемся с вами в ближайшее время для оформления подписки.
        </p>
        <Button asChild><Link to="/">На главную</Link></Button>
      </div>
    );
  }

  return (
    <>
      <PageSEO title={`Подписка ${info.name} — Бабиджон`} description={`Оформление подписки ${info.name}`} path={`/subscribe/${plan}`} />
      <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
        <Link to="/pricing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад к тарифам
        </Link>

        {/* Plan summary */}
        <div className="border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-bold text-foreground">{info.name}</h1>
            <span className="text-lg font-semibold text-primary">{info.price}</span>
          </div>
          <ul className="space-y-1.5">
            {info.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Оформить подписку</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Имя *</Label>
                <Input {...register('full_name', { required: 'Обязательное поле' })} placeholder="Иван Иванов" />
                {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" {...register('email', { required: 'Обязательное поле' })} placeholder="email@example.com" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label>Телефон</Label>
                <Input {...register('phone')} placeholder="+375 (__) ___-__-__" />
              </div>
              <div>
                <Label>Организация</Label>
                <Input {...register('organization')} placeholder="ООО «Компания»" />
              </div>

              {!user && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Для отправки заявки необходимо <Link to="/auth" className="underline font-medium">войти в аккаунт</Link>.
                </p>
              )}

              <Button type="submit" className="w-full min-h-[44px]" disabled={isSubmitting || !user}>
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Наш менеджер свяжется с вами для оформления оплаты
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
