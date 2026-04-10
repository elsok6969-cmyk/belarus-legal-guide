import { PageSEO } from '@/components/shared/PageSEO';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageSEO title="Политика конфиденциальности" description="Политика конфиденциальности сервиса Бабиджон" path="/privacy" />
      <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
      
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Какие данные мы собираем</h2>
          <p>При использовании сервиса «Бабиджон» мы можем собирать следующие данные:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Адрес электронной почты и имя — при регистрации</li>
            <li>История поисковых запросов и просмотренных документов</li>
            <li>Технические данные: IP-адрес, тип браузера, операционная система, время визита</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Для чего используем данные</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Предоставление доступа к сервису и его функциям</li>
            <li>Персонализация: закладки, история, рекомендации</li>
            <li>Отправка уведомлений об изменениях в отслеживаемых документах</li>
            <li>Внутренняя аналитика для улучшения качества сервиса</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Хранение и защита</h2>
          <p>Данные хранятся на серверах в Европейском союзе с использованием шифрования при передаче (TLS) и хранении. Доступ к данным имеют только уполномоченные сотрудники.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Передача третьим лицам</h2>
          <p>Мы не продаём и не передаём персональные данные третьим лицам в коммерческих целях. Данные могут быть переданы только по требованию законодательства Республики Беларусь.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Ваши права</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Запросить копию ваших персональных данных</li>
            <li>Удалить аккаунт и все связанные данные</li>
            <li>Отказаться от email-рассылок и уведомлений</li>
            <li>Потребовать исправления неточных данных</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Файлы cookie</h2>
          <p>Сервис использует cookies для поддержания сессии авторизации и запоминания пользовательских настроек. Аналитические cookies помогают нам понимать, как пользователи взаимодействуют с сервисом.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Контакты</h2>
          <p>По вопросам обработки персональных данных: <a href="mailto:info@babijon.by" className="text-primary underline hover:no-underline">info@babijon.by</a></p>
        </section>
      </div>
    </div>
  );
}
