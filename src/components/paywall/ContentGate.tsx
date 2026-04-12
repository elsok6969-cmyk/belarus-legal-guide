import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface ContentGateProps {
  renderContent: () => ReactNode;
  sectionIndex: number;
  sectionTitle?: string | null;
  sectionNumber?: string | null;
  documentTitle: string;
  totalSections: number;
  userPlan?: string;
}

function getLimit(user: any, userPlan?: string): number {
  if (!user) return 5;
  const plan = userPlan || 'free';
  const paid = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
  if (paid.includes(plan)) return Infinity;
  return 15;
}

export function PaywallBlock({ user }: { user: any }) {
  return (
    <div id="paywall-gate" className="border rounded-xl p-8 text-center mt-6">
      <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />

      {!user ? (
        <>
          <h3 className="text-lg font-semibold">Текст статьи доступен после регистрации</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Зарегистрируйтесь и получите доступ к 15 статьям каждого документа
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button asChild>
              <Link to="/auth">Зарегистрироваться бесплатно</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Уже есть аккаунт?{' '}
            <Link to="/auth" className="text-primary hover:underline">Войти</Link>
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">Вы прочитали 15 статей бесплатно</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Оформите подписку для полного доступа ко всем документам
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Персональный — 69 BYN/мес · Корпоративный — 99 BYN/мес
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button asChild>
              <Link to="/pricing">Оформить подписку</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function ContentGate({
  renderContent,
  sectionIndex,
  sectionTitle,
  sectionNumber,
  documentTitle,
  totalSections,
  userPlan,
}: ContentGateProps) {
  const { user } = useAuth();
  const limit = getLimit(user, userPlan);
  const isFullyVisible = sectionIndex < limit;
  const isBoundary = sectionIndex === limit;
  const isHidden = sectionIndex > limit;

  if (isFullyVisible) {
    return <div className="free-content">{renderContent()}</div>;
  }

  if (isBoundary) {
    const displayTitle = sectionNumber
      ? `${sectionNumber} ${sectionTitle || ''}`
      : sectionTitle;
    return (
      <div id={`section-${sectionIndex}`} className="scroll-mt-24">
        {displayTitle && (
          <h2 className="text-lg font-bold mt-8 mb-2 text-foreground font-serif">
            {displayTitle}
          </h2>
        )}
        <PaywallBlock user={user} />
      </div>
    );
  }

  if (isHidden) {
    const displayTitle = sectionNumber
      ? `${sectionNumber} ${sectionTitle || ''}`
      : sectionTitle;
    return displayTitle ? (
      <div id={`section-${sectionIndex}`} className="py-1.5 scroll-mt-24">
        <p className="text-sm text-muted-foreground select-none">{displayTitle}</p>
      </div>
    ) : null;
  }

  return null;
}
