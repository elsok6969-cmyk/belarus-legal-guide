import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { useAuth } from '@/hooks/useAuth';

const featureLabels: Record<string, string> = {
  search: 'поисковых запросов',
  ai_chat: 'вопросов AI-ассистенту',
  calculator: 'расчётов',
  favorites: 'документов в избранном',
  watch: 'документов на контроле',
};

const planUpgrade: Record<string, { name: string; limit: string }> = {
  free: { name: 'Basic', limit: 'больше возможностей' },
  basic: { name: 'Professional', limit: 'безлимитный доступ' },
};

interface PaywallProps {
  feature: string;
  children: ReactNode;
}

export function Paywall({ feature, children }: PaywallProps) {
  const { user } = useAuth();
  const { allowed, used, limit, plan, isLoading } = useUsageLimit(feature);

  if (!user || isLoading) return <>{children}</>;
  if (allowed) return <>{children}</>;

  const label = featureLabels[feature] || feature;
  const upgrade = planUpgrade[plan];

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border rounded-xl shadow-lg p-6 max-w-sm text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Лимит исчерпан</h3>
          <p className="text-sm text-muted-foreground">
            Вы использовали {used}/{limit} {label} за сегодня.
          </p>
          {upgrade && (
            <p className="text-sm text-muted-foreground">
              Перейдите на план <span className="font-medium text-foreground">{upgrade.name}</span> для {upgrade.limit}.
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button asChild size="sm">
              <Link to="/pricing">Выбрать план</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">Узнать больше</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
