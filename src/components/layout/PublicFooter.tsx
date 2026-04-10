import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';

const sections = [
  { label: 'Документы', to: '/documents' },
  { label: 'Кодексы', to: '/documents?filter=codex' },
  { label: 'Курсы валют', to: '/currencies' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'AI-помощник', to: '/app/assistant' },
  { label: 'Тарифы', to: '/pricing' },
];

const legalResources = [
  { label: 'pravo.by', href: 'https://pravo.by' },
  { label: 'etalonline.by', href: 'https://etalonline.by' },
  { label: 'НБРБ', href: 'https://nbrb.by' },
];

export function PublicFooter() {
  return (
    <footer role="contentinfo" className="border-t bg-card px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* About */}
          <div>
            <h4 className="text-sm font-semibold mb-3">О проекте</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Бабиджон — справочная правовая система. Не является официальным источником права.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Разделы</h4>
            <ul className="space-y-2">
              {sections.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal resources */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Правовые ресурсы</h4>
            <ul className="space-y-2">
              {legalResources.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Контакты</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@babijon.by" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  info@babijon.by
                </a>
              </li>
              <li>
                <a href="https://t.me/babijon_support" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  @babijon_support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Информация носит справочный характер.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Условия использования
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
