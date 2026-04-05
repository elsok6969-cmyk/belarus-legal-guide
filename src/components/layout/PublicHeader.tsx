import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Scale, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Новости', to: '/news' },
  { label: 'Темы', to: '/topics' },
  { label: 'Документы', to: '/documents' },
  { label: 'Курсы валют', to: '/rates' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'Эксперты', to: '/experts' },
];

export function PublicHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header role="banner" className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Scale className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>Право<span className="text-primary">&nbsp;БY</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-primary',
                location.pathname === l.to || location.pathname.startsWith(l.to + '/')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-xs font-medium">
            <Link to="/login">Войти</Link>
          </Button>
          <Button asChild size="sm" className="text-xs font-medium">
            <Link to="/app">Войти в сервис</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-card px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  location.pathname === l.to
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/login" onClick={() => setMobileOpen(false)}>Войти</Link>
            </Button>
            <Button asChild size="sm" className="w-full">
              <Link to="/app" onClick={() => setMobileOpen(false)}>Войти в сервис</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
