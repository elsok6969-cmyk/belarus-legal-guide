import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Zap, Search, Calculator, Star, Eye } from 'lucide-react';

const planLabels: Record<string, string> = {
  free: 'Пробный — 0 BYN',
  basic: 'Пробный — 0 BYN',
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

export default function SubscriptionPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-profile-sub', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_plan, subscription_expires_at')
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

  const plan = profile?.subscription_plan || 'free';

  return (
    <div className="space-y-6">
      <PageSEO title="Подписка" description="Управление подпиской" path="/app/account/subscription" noindex />

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Crown className="h-6 w-6 text-primary" /> Подписка
      </h1>

      <Card className="bg-accent/30 border-primary/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">{planLabels[plan] || plan}</p>
              {profile?.subscription_expires_at && (
                <p className="text-sm text-muted-foreground">
                  Активна до {new Date(profile.subscription_expires_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            <Button asChild>
              <Link to="/pricing">{plan === 'free' ? 'Выбрать план' : 'Изменить план'}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
