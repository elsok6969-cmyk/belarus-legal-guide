import {
  Home, BookOpen, FileText, Compass, Calculator, FolderOpen, List,
  CalendarDays, Info, Star, Bell, Clock, Bot, Settings, Sun, Moon,
  User, ChevronRight,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { title: 'Главная', url: '/app', icon: Home, end: true },
  { title: 'Кодексы', url: '/app/codex', icon: BookOpen },
  { title: 'Новые документы', url: '/app/search', icon: FileText },
  { title: 'Проводник', url: '/app/guide', icon: Compass },
  { title: 'Калькуляторы', url: '/app/calculator', icon: Calculator },
  { title: 'Формы документов', url: '/app/search?type=form', icon: FolderOpen },
  { title: 'Классификаторы', url: '/app/search?type=classifier', icon: List },
  { title: 'Календарь дедлайнов', url: '/app/calendar', icon: CalendarDays },
  { title: 'Справочная информация', url: '/app/topics', icon: Info },
];

const personalItems = [
  { title: 'Избранное', url: '/app/bookmarks', icon: Star },
  { title: 'Уведомления', url: '/app/updates', icon: Bell, badge: true },
  { title: 'История просмотров', url: '/app/search', icon: Clock },
];

const bottomNav = [
  { title: 'AI-помощник', url: '/app/assistant', icon: Bot },
  { title: 'Настройки', url: '/app/settings', icon: Settings },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const { data: profile } = useQuery({
    queryKey: ['sidebar-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, profession')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 300000,
  });

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

  const displayName = profile?.full_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const initials = displayName.charAt(0).toUpperCase();
  const professionLabels: Record<string, string> = {
    accountant: 'Бухгалтер',
    lawyer: 'Юрист',
    hr_specialist: 'Кадровик',
    economist: 'Экономист',
    entrepreneur: 'Предприниматель',
  };
  const professionLabel = profile?.profession ? professionLabels[profile.profession] || profile.profession : null;

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderItems = (items: typeof navItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={'end' in item && item.end}
              className="hover:bg-sidebar-accent/50"
              activeClassName="bg-primary/10 text-primary font-medium"
              onClick={closeMobile}
            >
              <item.icon className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.title}</span>
              )}
              {!collapsed && 'badge' in item && item.badge && !!unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col">
        {/* User profile */}
        {!collapsed && user && (
          <div className="p-4 pb-2">
            <Link
              to="/profile"
              onClick={closeMobile}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/50 transition-colors group"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {professionLabel && (
                  <p className="text-[11px] text-muted-foreground truncate">{professionLabel}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
            </Link>
          </div>
        )}

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            {renderItems(navItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4" />

        {/* Personal */}
        <SidebarGroup>
          <SidebarGroupContent>
            {renderItems(personalItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4" />

        {/* Bottom nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            {renderItems(bottomNav)}
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <div className="px-4 pb-4 space-y-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/50 transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Тёмная тема</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Светлая тема</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">v0.1.0-beta</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
