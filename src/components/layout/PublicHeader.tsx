import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, LayoutDashboard, User, Star, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { label: 'Документы', to: '/documents' },
  { label: 'Курсы валют', to: '/currencies' },
  { label: 'Календарь', to: '/production-calendar' },
  { label: 'Калькуляторы', to: '/calculator' },
  { label: 'Новости', to: '/news' },
  { label: 'Тарифы', to: '/pricing' },
];

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (to: string) => {
    if (to.includes('?')) return location.pathname + location.search === to;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const userInitial = user?.user_metadata?.display_name?.[0]
    || user?.user_metadata?.full_name?.[0]
    || user?.email?.[0]
    || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b shadow-sm"
          : "bg-background border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight text-foreground">
          Бабиджон
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:text-primary',
                isActive(l.to) ? 'text-primary bg-accent' : 'text-muted-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {userInitial.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/app" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" /> Личный кабинет
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/account/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" /> Профиль
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/account/favorites" className="flex items-center gap-2 cursor-pointer">
                    <Star className="h-4 w-4" /> Избранное
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="text-xs font-medium rounded-lg">
                <Link to="/auth">Войти</Link>
              </Button>
              <Button asChild size="sm" className="text-xs font-medium rounded-lg">
                <Link to="/auth">Регистрация</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-background px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(l.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t">
            {user ? (
              <>
                <Link to="/app" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-accent">
                  <LayoutDashboard className="h-4 w-4" /> Личный кабинет
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2 text-sm font-medium text-destructive px-3 py-2.5 rounded-lg hover:bg-accent text-left"
                >
                  <LogOut className="h-4 w-4" /> Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2.5">Войти</Link>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Регистрация</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
