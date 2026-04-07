import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Bell, User, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : '??';

  const { data: indicators } = useQuery({
    queryKey: ['economic-indicators'],
    queryFn: async () => {
      const { data } = await supabase
        .from('economic_indicators')
        .select('*')
        .in('slug', ['refinancing-rate', 'min-salary', 'base-value']);
      return data || [];
    },
    staleTime: 3600000,
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

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ru-RU') : '—';

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger className="shrink-0" />

      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по документам..."
          className="pl-9"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {indicators && indicators.length > 0 && (
        <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
          {indicators.map((ind) => (
            <Tooltip key={ind.id}>
              <TooltipTrigger asChild>
                <span className="cursor-default whitespace-nowrap">
                  {ind.name_ru}: <span className="font-medium text-foreground">{ind.current_value}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Обновлено: {formatDate(ind.effective_date)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        onClick={() => navigate('/app/updates')}
      >
        <Bell className="h-4 w-4" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
            {user?.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Профиль
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Настройки
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
