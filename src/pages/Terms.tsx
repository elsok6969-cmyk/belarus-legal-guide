import { PageSEO } from '@/components/shared/PageSEO';

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageSEO title="Условия использования" description="Условия использования сервиса Бабиджон" path="/terms" />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Условия использования</h1>
      
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Общие положения</h2>
          <p>Сервис «Бабиджон» предоставляет справочную правовую информацию по законодательству Республики Беларусь. Сервис не является официальным источником правовой информации и не заменяет Национальный правовой интернет-портал.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Функциональность сервиса</h2>
          <p>Пользователям доступны: база нормативных правовых актов РБ, полнотекстовый поиск по документам и статьям, калькуляторы (НДС, подоходный налог, отпускные и др.), налоговый календарь с ближайшими сроками сдачи отчётности, курсы валют НБРБ.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Регистрация и доступ</h2>
          <p>Базовый доступ к НПА и поиску предоставляется без регистрации. Для использования расширенных функций (AI-ассистент, закладки, уведомления об изменениях) необходима регистрация. Платные тарифные планы описаны на странице <a href="/pricing" className="text-primary underline hover:no-underline">/pricing</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Ограничение ответственности</h2>
          <p>Информация на сервисе предоставляется «как есть». Мы прилагаем усилия для поддержания актуальности текстов, однако не гарантируем их полноту и точность. Для принятия юридически значимых решений обращайтесь к квалифицированным специалистам.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. AI-помощник</h2>
          <p>Встроенный AI-помощник генерирует ответы автоматически на основе базы НПА. Ответы носят информационный характер и могут содержать неточности. Всегда проверяйте информацию по первоисточнику.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Интеллектуальная собственность</h2>
          <p>Дизайн, код и оригинальные материалы сервиса являются собственностью «Бабиджон». Тексты нормативных правовых актов Республики Беларусь являются общедоступными и не охраняются авторским правом.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Контакты</h2>
          <p>По вопросам использования сервиса: <a href="mailto:info@babijon.by" className="text-primary underline hover:no-underline">info@babijon.by</a></p>
        </section>
      </div>
    </div>
  );
}
