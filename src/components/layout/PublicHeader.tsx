import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Scale, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Новости', to: '/news' },
  { label: 'Темы', to: '/topics' },
  { label: 'Эксперты', to: '/experts' },
  { label: 'О платформе', to: '/about' },
  { label: 'Тарифы', to: '/pricing' },
];

export function PublicHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header role="banner" className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Право&nbsp;БY
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                location.pathname === l.to && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Войти</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Регистрация</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
                  location.pathname === l.to && 'bg-accent font-medium'
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
              <Link to="/register" onClick={() => setMobileOpen(false)}>Регистрация</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
