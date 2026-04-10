import { PageSEO } from '@/components/shared/PageSEO';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageSEO title="Политика конфиденциальности" description="Политика конфиденциальности сервиса Бабиджон" path="/privacy" />
      <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
      
      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Общие положения</h2>
          <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса Бабиджон.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Сбор данных</h2>
          <p>Мы собираем только те данные, которые необходимы для предоставления наших услуг: адрес электронной почты, имя пользователя и информацию об использовании сервиса.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Использование данных</h2>
          <p>Персональные данные используются исключительно для предоставления доступа к сервису, улучшения качества обслуживания и отправки уведомлений.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Защита данных</h2>
          <p>Мы применяем современные технические и организационные меры для защиты ваших данных от несанкционированного доступа, изменения или уничтожения.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Контакты</h2>
          <p>По вопросам обработки персональных данных обращайтесь по электронной почте: info@babijon.by</p>
        </section>
      </div>
    </div>
  );
}
