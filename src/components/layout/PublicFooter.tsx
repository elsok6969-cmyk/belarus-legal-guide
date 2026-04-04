import { Link } from 'react-router-dom';
import { Scale, Mail } from 'lucide-react';
import { DisclaimerShort } from '@/components/shared/Disclaimers';

const footerLinks = {
  product: [
    { label: 'О платформе', to: '/about' },
    { label: 'Как это работает', to: '/how-it-works' },
    { label: 'Тарифы', to: '/pricing' },
  ],
  legal: [
    { label: 'Отказ от ответственности', to: '/legal' },
    { label: 'Условия использования', to: '/legal#terms' },
    { label: 'Политика конфиденциальности', to: '/legal#privacy' },
  ],
  account: [
    { label: 'Войти', to: '/login' },
    { label: 'Регистрация', to: '/register' },
  ],
};

export function PublicFooter() {
  return (
    <footer role="contentinfo" className="border-t bg-card px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand + contact */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
              Право&nbsp;БY
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Платформа правовой информации Республики Беларусь
            </p>
            <a
              href="mailto:info@pravo.by"
              className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              info@pravo.by
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Продукт</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Правовая информация</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Аккаунт</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer + copyright */}
        <div className="mt-10 border-t pt-6 space-y-3">
          <DisclaimerShort className="mx-auto max-w-xl text-center" />
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Право БY. Платформа не является государственным информационным ресурсом.
          </p>
        </div>
      </div>
    </footer>
  );
}
