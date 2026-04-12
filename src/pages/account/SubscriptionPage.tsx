import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Crown, Zap, Search, Calculator, Star, Eye, Check, AlertTriangle } from 'lucide-react';

const planLabels: Record<string, string> = {
  free: 'Пробный (бесплатный)',
  basic: 'Пробный (бесплатный)',
  personal: 'Персональный — 69 BYN/мес',
  professional: 'Корпоративный — 99 BYN/мес',
  corporate: 'Корпоративный — 99 BYN/мес',
};

const featureLabels: Record<string, { label: string; icon: typeof Zap }> = {
  ai_chat: { label: 'AI-ассистент', icon: Zap },
  search: { label: 'Поиск', icon: Search },
  calculator: { label: 'Калькуляторы', icon: Calculator },
  favorites: { label: 'Избранное', icon: Star },
  watch: { label: 'На контроле', icon: Eye },
};

const plans = [
  {
    id: 'personal',
    name: 'Персональный',
    price: '69 BYN/мес',
    features: ['Неограниченный поиск', 'AI-ассистент — 50 запросов/день', 'Все калькуляторы', 'Избранное и контроль документов'],
    corporate: false,
  },
  {
    id: 'professional',
    name: 'Корпоративный',
    price: '99 BYN/мес',
    features: ['Всё из Персонального', 'AI-ассистент — без ограничений', 'Приоритетная поддержка', 'Корпоративные документы'],
    corporate: true,
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formUnp, setFormUnp] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['user-profile-sub', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: limits } = useQuery({
    queryKey: ['my-limits', user?.id],
    queryFn: async () => {
      const features = ['ai_chat', 'search', 'calculator', 'favorites', 'watch'];
      const results = await Promise.all(
        features.map(async (f) => {
          const { data } = await supabase.rpc('check_limit', { p_user_id: user!.id, p_feature: f });
          return { feature: f, ...(data as any) };
        })
      );
      return results;
    },
    enabled: !!user,
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('subscription_requests').insert({
        user_id: user!.id,
        plan: selectedPlan!,
        full_name: formName,
        email: user!.email!,
        phone: formPhone || null,
        company_name: formCompany || null,
        unp: formUnp || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setSelectedPlan(null);
      toast.success('Спасибо! Мы свяжемся с вами для оформления подписки.');
    },
    onError: () => toast.error('Ошибка при отправке заявки'),
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_plan: 'free', subscription_expires_at: null } as any)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setShowCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile-sub'] });
      queryClient.invalidateQueries({ queryKey: ['my-limits'] });
      toast.success('Подписка отключена. Вы переведены на бесплатный план.');
    },
    onError: () => toast.error('Ошибка при отмене подписки'),
  });

  const plan = profile?.subscription_plan || 'free';
  const isPaid = plan !== 'free' && plan !== 'basic';
  const isCorporatePlan = selectedPlan === 'professional';

  const openRequestForm = (planId: string) => {
    setFormName([profile?.full_name, (profile as any)?.last_name].filter(Boolean).join(' '));
    setFormPhone((profile as any)?.phone || '');
    setFormCompany(profile?.company_name || '');
    setFormUnp((profile as any)?.unp || '');
    setSelectedPlan(planId);
  };

  return (
    <div className="space-y-6">
      <PageSEO title="Подписка" description="Управление подпиской" path="/app/account/subscription" noindex />

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Crown className="h-6 w-6 text-primary" /> Подписка
      </h1>

      {/* Current plan */}
      <Card className="bg-accent/30 border-primary/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">Ваш план: {planLabels[plan] || plan}</p>
              {profile?.subscription_expires_at && (
                <p className="text-sm text-muted-foreground">
                  Активен до {new Date(profile.subscription_expires_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            {isPaid && (
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowCancelDialog(true)}>
                Отменить подписку
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Использование лимитов сегодня</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {limits?.map((l) => {
            const info = featureLabels[l.feature];
            if (!info) return null;
            const Icon = info.icon;
            const isUnlimited = l.limit === null;
            const pct = isUnlimited ? 0 : ((l.used || 0) / l.limit) * 100;
            return (
              <div key={l.feature} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {info.label}
                  </span>
                  <span className="font-medium">
                    {isUnlimited ? '∞' : `${l.used}/${l.limit}`}
                  </span>
                </div>
                {!isUnlimited && <Progress value={pct} className="h-2" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Plan cards */}
      {(plan === 'free' || plan === 'basic') && !submitted && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Улучшить план</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((p) => {
              const isCurrent = p.id === plan;
              return (
                <Card key={p.id} className={isCurrent ? 'border-primary/40 bg-accent/20' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {isCurrent && <Badge variant="secondary">Текущий</Badge>}
                    </div>
                    <p className="text-2xl font-bold text-primary">{p.price}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      disabled={isCurrent}
                      onClick={() => openRequestForm(p.id)}
                    >
                      {isCurrent ? 'Текущий план' : 'Оставить заявку'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {submitted && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 text-center">
            <p className="font-semibold text-lg">Заявка отправлена!</p>
            <p className="text-muted-foreground mt-1">Мы свяжемся с вами для оформления подписки.</p>
          </CardContent>
        </Card>
      )}

      {/* Request form dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заявка на план «{plans.find((p) => p.id === selectedPlan)?.name}»</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Иванов Иван" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+375 29 123 45 67" />
            </div>
            {isCorporatePlan && (
              <>
                <div className="space-y-2">
                  <Label>Организация</Label>
                  <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Название" />
                </div>
                <div className="space-y-2">
                  <Label>УНП</Label>
                  <Input value={formUnp} onChange={(e) => setFormUnp(e.target.value)} placeholder="123456789" />
                </div>
              </>
            )}
            <Button
              className="w-full"
              onClick={() => submitRequest.mutate()}
              disabled={!formName || submitRequest.isPending}
            >
              {submitRequest.isPending ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
