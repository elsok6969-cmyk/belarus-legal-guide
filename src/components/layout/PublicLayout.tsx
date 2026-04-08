import { ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ExitIntentPopup } from '@/components/paywall/ExitIntentPopup';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main role="main" className="flex-1">{children}</main>
      <PublicFooter />
      <ExitIntentPopup />
    </div>
  );
}
