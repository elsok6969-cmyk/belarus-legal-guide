import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

const navLinks = [
  { label: 'Документы', to: '/documents' },
  { label: 'Кодексы', to: '/documents?filter=codex' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'Тарифы', to: '/pricing' },
  { label: 'AI-помощник', to: '/app/assistant' },
];

export function PublicHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isActive = (to: string) => {
    if (to.includes('?')) return location.pathname + location.search === to;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <header role="banner" className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight">
          <span className="text-primary">Право</span>
          <span className="text-foreground">БУ</span>
        </Link>

        {/* Desktop nav — centered */}
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

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button asChild variant="outline" size="sm" className="text-xs font-medium rounded-lg">
            <Link to="/auth">Войти</Link>
          </Button>
          <Button asChild size="sm" className="text-xs font-medium rounded-lg">
            <Link to="/auth">Регистрация</Link>
          </Button>
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
            <Button asChild variant="outline" size="sm" className="w-full rounded-lg">
              <Link to="/auth" onClick={() => setMobileOpen(false)}>Войти</Link>
            </Button>
            <Button asChild size="sm" className="w-full rounded-lg">
              <Link to="/auth" onClick={() => setMobileOpen(false)}>Регистрация</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
