import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Settings, Star, Bell, History, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const links = [
  { to: '/app/account/profile', label: 'Профиль', icon: User },
  { to: '/app/account/settings', label: 'Настройки', icon: Settings },
  { to: '/app/account/favorites', label: 'Избранное', icon: Star },
  { to: '/app/account/notifications', label: 'Уведомления', icon: Bell },
  { to: '/app/account/history', label: 'История', icon: History },
  { to: '/app/account/subscription', label: 'Подписка', icon: Crown },
];

export default function AccountLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-2 px-1">
            {links.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </RouterNavLink>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-5xl mx-auto">
      <nav className="w-52 shrink-0 space-y-1 pt-1">
        {links.map((l) => (
          <RouterNavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </RouterNavLink>
        ))}
      </nav>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
