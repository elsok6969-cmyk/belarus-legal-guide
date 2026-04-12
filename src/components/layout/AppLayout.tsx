import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, FileText, Compass, Calculator, CalendarDays, Info,
  Star, Bell, Clock, Bot, Settings, User, Crown, Sun, Moon, Menu, X, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TopBar } from './TopBar';

const mainNav = [
  { to: '/app', label: 'Главная', icon: Home, end: true },
  { to: '/app/codex', label: 'Кодексы', icon: BookOpen },
  { to: '/app/new-documents', label: 'Новые документы', icon: FileText },
  { to: '/app/guide', label: 'Справочник', icon: Compass },
  { to: '/app/calculator', label: 'Калькуляторы', icon: Calculator },
  { to: '/app/calendar', label: 'Календарь сроков', icon: CalendarDays },
  { to: '/app/topics', label: 'Темы и обзоры', icon: Info },
];

const personalNav = [
  { to: '/app/account/favorites', label: 'Избранное', icon: Star },
  { to: '/app/account/notifications', label: 'Уведомления', icon: Bell, badge: true },
  { to: '/app/account/history', label: 'История', icon: Clock },
];

const bottomNav = [
  { to: '/app/assistant', label: 'AI-помощник', icon: Bot },
  { to: '/app/account/profile', label: 'Профиль', icon: User },
  { to: '/app/account/settings', label: 'Настройки', icon: Settings },
  { to: '/app/account/subscription', label: 'Подписка', icon: Crown },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
  });

  const showSidebar = isMobile ? sidebarOpen : sidebarOpen;

  const renderLink = (item: { to: string; label: string; icon: React.ElementType; end?: boolean; badge?: boolean }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={() => isMobile && setSidebarOpen(false)}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && !!unreadCount && unreadCount > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card w-60 shrink-0 transition-transform duration-200',
          isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative',
          isMobile && !sidebarOpen && '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <NavLink to="/app" className="text-lg font-bold text-primary">
            Бабиджон
          </NavLink>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {mainNav.map(renderLink)}
          <Separator className="my-3" />
          {personalNav.map(renderLink)}
          <Separator className="my-3" />
          {bottomNav.map(renderLink)}
        </nav>

        <div className="border-t p-3 space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          </button>
          <NavLink
            to="/"
            className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На сайт
          </NavLink>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
