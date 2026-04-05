import { Home, Search, FileText, Bookmark, Tag, MessageSquare, Bell, Settings, DollarSign, CalendarDays } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Главная', url: '/app', icon: Home },
  { title: 'Поиск', url: '/app/search', icon: Search },
  { title: 'Закладки', url: '/app/bookmarks', icon: Bookmark },
  { title: 'Темы', url: '/app/topics', icon: Tag },
  { title: 'AI Ассистент', url: '/app/assistant', icon: MessageSquare },
  { title: 'Обновления', url: '/app/updates', icon: Bell },
];

const serviceItems = [
  { title: 'Курсы валют', url: '/app/services/rates', icon: DollarSign },
  { title: 'Календарь сроков', url: '/app/services/calendar', icon: CalendarDays },
];

const bottomItems = [
  { title: 'Настройки', url: '/app/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-xs uppercase tracking-wider">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === '/app'}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          {renderGroup('Навигация', mainItems)}
          {renderGroup('Сервисы', serviceItems)}
        </div>
        {renderGroup('', bottomItems)}
      </SidebarContent>
    </Sidebar>
  );
}
