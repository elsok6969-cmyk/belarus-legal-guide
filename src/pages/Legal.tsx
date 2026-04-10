import { Link } from 'react-router-dom';
import { PageSEO } from '@/components/shared/PageSEO';
import { DisclaimerFull } from '@/components/shared/Disclaimers';

export default function Legal() {
  return (
    <div>
      <PageSEO title="Правовая информация — Бабиджон" description="Условия использования, политика конфиденциальности и отказ от ответственности" path="/legal" />
      <section className="bg-primary px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">Правовая информация</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Условия использования платформы и ограничение ответственности
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Отказ от ответственности</h2>
            <DisclaimerFull className="mt-4" />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Документы</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/terms"
                className="rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <p className="font-semibold text-foreground">Условия использования</p>
                <p className="text-sm text-muted-foreground mt-1">Правила пользования платформой Бабиджон</p>
              </Link>
              <Link
                to="/privacy"
                className="rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <p className="font-semibold text-foreground">Политика конфиденциальности</p>
                <p className="text-sm text-muted-foreground mt-1">Как мы собираем и защищаем ваши данные</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
