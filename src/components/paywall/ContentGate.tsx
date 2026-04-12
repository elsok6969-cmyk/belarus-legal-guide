import { useEffect, useRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getSessionId } from '@/hooks/useVisitTracking';
import { supabase } from '@/integrations/supabase/client';

interface ContentGateProps {
  renderContent: () => ReactNode;
  sectionIndex: number;
  sectionTitle?: string | null;
  sectionNumber?: string | null;
  previewSnippet?: string;
  documentTitle: string;
  totalSections: number;
  userPlan?: string;
}

/**
 * Access tiers:
 *   guest (no auth)        → 3 articles free
 *   free (registered)      → 10 articles free
 *   personal / corporate+  → unlimited
 */
function getLimit(user: any, userPlan?: string): number {
  if (!user) return 3;
  const plan = userPlan || 'free';
  const paid = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
  if (paid.includes(plan)) return Infinity;
  return 10;
}

export function ContentGate({
  renderContent,
  sectionIndex,
  sectionTitle,
  sectionNumber,
  previewSnippet,
  documentTitle,
  totalSections,
  userPlan,
}: ContentGateProps) {
  const { user } = useAuth();
  const impressionTracked = useRef(false);

  const limit = getLimit(user, userPlan);
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

  // Fully visible
  if (isFullyVisible) {
    return <div className="free-content">{renderContent()}</div>;
  }

  // Hidden sections beyond boundary — show title only (greyed out)
  if (isHidden) {
    const displayTitle = sectionNumber
      ? `${sectionNumber} ${sectionTitle || ''}`
      : sectionTitle;
    return displayTitle ? (
      <div id={`section-${sectionIndex}`} className="py-2 scroll-mt-24">
        <p className="text-sm text-muted-foreground/60 select-none">{displayTitle}</p>
      </div>
    ) : null;
  }

  // Boundary section — blur teaser + paywall
  const snippet = previewSnippet || '';
  const displayTitle = sectionNumber
    ? `${sectionNumber} ${sectionTitle || ''}`
    : sectionTitle;

  return (
    <div id="paywall-gate" className="scroll-mt-24">
      {/* Section heading (visible) */}
      {displayTitle && (
        <h2 className="text-lg font-bold mt-8 mb-2 text-foreground font-serif">
          {displayTitle}
        </h2>
      )}

      {/* Blurred teaser text */}
      {snippet && (
        <div className="relative select-none pointer-events-none mb-2">
          <p
            className="text-base leading-[1.8] font-serif text-foreground"
            style={{ filter: 'blur(4px)' }}
          >
            {snippet.slice(0, 200)}...
          </p>
        </div>
      )}

      {/* Paywall block */}
      <div className="bg-background/90 backdrop-blur-sm border rounded-xl p-6 text-center mt-4">
        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />

        {!user ? (
          <>
            <p className="font-semibold">Полный текст доступен по подписке</p>
            <p className="text-sm text-muted-foreground mt-1">
              Зарегистрируйтесь для пробного доступа
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button asChild onClick={() => trackClick('click_register')}>
                <Link to="/auth">Зарегистрироваться</Link>
              </Button>
              <Button variant="outline" asChild onClick={() => trackClick('click_pricing')}>
                <Link to="/pricing">Тарифы</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold">
              Вы просмотрели {limit} статей бесплатно
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Оформите подписку для полного доступа
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Персональный — 69 BYN/мес
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button asChild onClick={() => trackClick('click_subscribe')}>
                <Link to="/pricing">Оформить подписку</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
