import { useEffect, useRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useVisitTracking, getSessionId } from '@/hooks/useVisitTracking';
import { supabase } from '@/integrations/supabase/client';

const FREE_CODEX_PATTERNS = [
  'гражданский кодекс',
  'трудовой кодекс',
  'налоговый кодекс.*общая часть',
];

function isFreeCodex(title: string): boolean {
  const lower = title.toLowerCase();
  return FREE_CODEX_PATTERNS.some(p => new RegExp(p, 'i').test(lower));
}

interface ContentGateProps {
  renderContent: () => ReactNode;
  sectionIndex: number;
  sectionTitle?: string | null;
  previewSnippet?: string;
  documentTitle: string;
  totalSections: number;
  userPlan?: string;
}

export function ContentGate({
  renderContent,
  sectionIndex,
  sectionTitle,
  previewSnippet,
  documentTitle,
  totalSections,
  userPlan,
}: ContentGateProps) {
  const { user } = useAuth();
  const { getFreeSectionsLimit } = useVisitTracking();
  const impressionTracked = useRef(false);

  const plan = userPlan || 'free';
  const isPaid = plan === 'personal' || plan === 'corporate' || plan === 'basic' || plan === 'professional' || plan === 'enterprise';

  let limit: number;
  if (!user) {
    limit = getFreeSectionsLimit();
  } else if (isPaid) {
    limit = Infinity;
  } else if (isFreeCodex(documentTitle)) {
    limit = Infinity;
  } else {
    limit = 10;
  }

  const isFullyVisible = sectionIndex < limit;
  const isBoundary = sectionIndex === limit;
  const isHidden = sectionIndex > limit;

  useEffect(() => {
    if (isBoundary && !impressionTracked.current) {
      impressionTracked.current = true;
      const sid = getSessionId();
      supabase.from('paywall_events').insert({
        session_id: sid,
        user_id: user?.id || null,
        event_type: 'impression',
        page_url: window.location.pathname,
      }).then(() => {});
    }
  }, [isBoundary, user?.id]);

  const trackClick = (eventType: string) => {
    const sid = getSessionId();
    supabase.from('paywall_events').insert({
      session_id: sid,
      user_id: user?.id || null,
      event_type: eventType,
      page_url: window.location.pathname,
    }).then(() => {});
  };

  if (isFullyVisible) {
    return <div className="free-content">{renderContent()}</div>;
  }

  if (isHidden) {
    return sectionTitle ? (
      <div className="py-2 px-4 text-sm text-muted-foreground/50 select-none">
        {sectionTitle}
      </div>
    ) : null;
  }

  const snippet = previewSnippet || sectionTitle || '';

  return (
    <div>
      {snippet && (
        <div className="relative max-h-[100px] overflow-hidden select-none pointer-events-none">
          <div className="text-sm text-muted-foreground leading-relaxed px-1">
            {sectionTitle && (
              <p className="font-semibold text-foreground/60 mb-1">{sectionTitle}</p>
            )}
            <p className="text-foreground/40">{snippet.slice(0, 120)}...</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="my-6 rounded-xl border-2 border-primary/20 bg-card p-6 md:p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>

        {!user ? (
          <>
            <h3 className="text-lg font-bold mb-2">Продолжение доступно после регистрации</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Зарегистрируйтесь и получите доступ к основным разделам сервиса
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild onClick={() => trackClick('click_register')}>
                <Link to="/auth">Зарегистрироваться</Link>
              </Button>
              <Button asChild variant="outline" onClick={() => trackClick('click_login')}>
                <Link to="/auth">Войти</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Полный текст доступен по подписке.{' '}
              <Link to="/pricing" className="text-primary hover:underline" onClick={() => trackClick('click_subscribe')}>
                Тарифы
              </Link>
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-2">Полный текст доступен по подписке</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Персональный — 69 BYN/мес, Корпоративный — 99 BYN/мес.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild onClick={() => trackClick('click_subscribe')}>
                <Link to="/subscribe/personal">Оформить подписку</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">Тарифы</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
