import { Link } from 'react-router-dom';
import { Mail, Send, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const product = [
  { label: 'Документы', to: '/documents' },
  { label: 'Кодексы', to: '/documents?filter=codex' },
  { label: 'AI-помощник', to: '/app/assistant' },
  { label: 'Калькуляторы', to: '/app/calculator' },
  { label: 'Тарифы', to: '/pricing' },
];

const resources = [
  { label: 'Календарь', to: '/calendar' },
  { label: 'Курсы НБРБ', to: '/rates' },
  { label: 'Статьи', to: '/news' },
  { label: 'Формы документов', to: '/app/forms' },
];

const company = [
  { label: 'О проекте', to: '/about' },
  { label: 'Условия', to: '/terms' },
  { label: 'Конфиденциальность', to: '/privacy' },
];

const legalLinks = [
  { label: 'pravo.by', href: 'https://pravo.by' },
  { label: 'etalonline.by', href: 'https://etalonline.by' },
  { label: 'НБРБ', href: 'https://nbrb.by' },
];

export function PublicFooter() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'hsl(var(--navy-900))',
        color: 'hsl(var(--navy-300))',
      }}
      className="px-6 py-16"
    >
      <div className="container-apple">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Product */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: 'hsl(var(--navy-100))' }}
            >
              Продукт
            </h4>
            <ul className="space-y-2.5">
              {product.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'hsl(var(--navy-300))' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: 'hsl(var(--navy-100))' }}
            >
              Ресурсы
            </h4>
            <ul className="space-y-2.5">
              {resources.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'hsl(var(--navy-300))' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'hsl(var(--navy-300))' }}
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: 'hsl(var(--navy-100))' }}
            >
              Компания
            </h4>
            <ul className="space-y-2.5">
              {company.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'hsl(var(--navy-300))' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: 'hsl(var(--navy-100))' }}
            >
              Контакты
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:info@babijon.by"
                  className="text-sm flex items-center gap-2 transition-colors hover:text-white"
                  style={{ color: 'hsl(var(--navy-300))' }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  info@babijon.by
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/babijon_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center gap-2 transition-colors hover:text-white"
                  style={{ color: 'hsl(var(--navy-300))' }}
                >
                  <Send className="h-3.5 w-3.5" />
                  @babijon_support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid hsl(var(--navy-700))' }}
        >
          <p className="text-xs" style={{ color: 'hsl(var(--navy-300))' }}>
            © {new Date().getFullYear()} Бабиджон. Информация носит справочный характер.
          </p>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs transition-colors hover:text-white"
            style={{ color: 'hsl(var(--navy-300))' }}
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? (
              <><Sun className="h-3.5 w-3.5" /> Светлая тема</>
            ) : (
              <><Moon className="h-3.5 w-3.5" /> Тёмная тема</>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
