import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageSEO } from '@/components/shared/PageSEO';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const planNames: Record<string, string> = {
  basic: 'Basic — 29 BYN/мес',
  professional: 'Professional — 59 BYN/мес',
  pro: 'Pro — 59 BYN/мес',
};

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  comment: string;
}

export default function Subscribe() {
  const { plan } = useParams<{ plan: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      email: user?.email || '',
      full_name: '',
      phone: '',
      comment: '',
    },
  });

  if (!plan || !planNames[plan]) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-muted-foreground">План не найден</p>
        <Button asChild><Link to="/pricing">К тарифам</Link></Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.from('subscription_requests').insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      plan: plan!,
      user_id: user?.id || null,
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
        <h1 className="text-2xl font-bold text-foreground">Заявка отправлена!</h1>
        <p className="text-muted-foreground">
          Наш менеджер свяжется с вами в ближайшее время для оформления подписки.
        </p>
        <Button asChild><Link to="/app">На главную</Link></Button>
      </div>
    );
  }

  return (
    <>
      <PageSEO title={`Подписка ${plan} — Бабиджон`} description="Оформление подписки" path={`/subscribe/${plan}`} />
      <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
        <Link to="/pricing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад к тарифам
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Оформить подписку</CardTitle>
            <p className="text-sm text-muted-foreground">План: <span className="font-medium text-foreground">{planNames[plan]}</span></p>
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
                <Label>Комментарий</Label>
                <Textarea {...register('comment')} placeholder="Название организации, пожелания..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Наш менеджер свяжется с вами для оформления оплаты
              </p>
            </form>
          </CardContent>
        </Ca