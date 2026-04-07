import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Документы', to: '/documents' },
  { label: 'Кодексы', to: '/documents?filter=codex' },
  { label: 'Курсы', to: '/currencies' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'Калькуляторы', to: '/app/calculator' },
  { label: 'Тарифы', to: '/pricing' },
];

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const isActive = (to: string) => {
    if (to.includes('?')) return location.pathname + location.search === to;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-[100] transition-all duration-300',
        scrolled
          ? 'border-b border-[hsl(var(--gray-200))]'
          : 'border-b border-transparent'
      )}
      style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: 64,
      }}
    >
      <div className="container-apple h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'hsl(var(--gray-900))', letterSpacing: '-0.5px' }}
        >
          Бабиджон
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden md:flex items-center" style={{ gap: 32 }}>
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'text-sm transition-colors duration-200',
                isActive(l.to)
                  ? 'font-medium'
                  : ''
              )}
              style={{
                color: isActive(l.to) ? 'hsl(var(--gray-900))' : 'hsl(var(--gray-600))',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--gray-900))')}
              onMouseLeave={(e) => {
                if (!isActive(l.to)) e.currentTarget.style.color = 'hsl(var(--gray-600))';
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn-ghost p-2 rounded-full"
            aria-label="Поиск"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link to="/auth" className="btn-ghost text-sm">
            Войти
          </Link>
          <Link
            to="/auth"
            className="btn-primary text-sm"
            style={{ padding: '8px 20px' }}
          >
            Регистрация
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2"
            aria-label="Поиск"
            style={{ color: 'hsl(var(--gray-600))' }}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
            style={{ color: 'hsl(var(--gray-900))' }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="absolute inset-x-0 top-0 z-[101] flex items-center px-4"
          style={{
            height: 64,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="container-apple w-full flex items-center gap-3">
            <Search className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--gray-400))' }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск документов..."
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: 'hsl(var(--gray-900))' }}
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="btn-ghost text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[98]"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-[99] w-[280px] flex flex-col"
            style={{
              background: 'hsl(0 0% 100%)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center justify-end p-4">
              <button onClick={() => setMobileOpen(false)} aria-label="Закрыть">
                <X className="h-5 w-5" style={{ color: 'hsl(var(--gray-600))' }} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-base font-medium transition-colors"
                  style={{
                    color: isActive(l.to) ? 'hsl(var(--gray-900))' : 'hsl(var(--gray-600))',
                    borderBottom: '1px solid hsl(var(--gray-100))',
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-4 flex flex-col gap-3">
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary w-full text-center"
              >
                Войти
              </Link>
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full text-center"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
