import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

const navLinks = [
  { label: 'Документы', to: '/documents' },
  { label: 'Кодексы', to: '/documents?filter=codex' },
  { label: 'Курсы валют', to: '/currencies' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'Тарифы', to: '/pricing' },
];

export function PublicHeader() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (to: string) => {
    if (to.includes('?')) return location.pathname + location.search === to;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <header role="banner" className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight text-foreground">
          Бабиджон
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs font-medium rounded-lg">
              <Link to="/auth">Войти</Link>
            </Button>
            <Button asChild size="sm" className="text-xs font-medium rounded-lg">
              <Link to="/auth">Регистрация</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-1 mt-8">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(l.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-2 mt-6 pt-6 border-t">
                <Button asChild variant="outline" size="sm" className="w-full rounded-lg">
                  <Link to="/auth">Войти</Link>
                </Button>
                <Button asChild size="sm" className="w-full rounded-lg">
                  <Link to="/auth">Регистрация</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
