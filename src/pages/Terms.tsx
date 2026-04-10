import { PageSEO } from '@/components/shared/PageSEO';

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageSEO title="Условия использования" description="Условия использования сервиса Бабиджон" path="/terms" />
      <h1 className="text-2xl font-bold mb-6">Условия использования</h1>
      
      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Общие положения</h2>
          <p>Настоящие условия регулируют использование сервиса Бабиджон. Используя сервис, вы соглашаетесь с данными условиями.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Предоставление информации</h2>
          <p>Информация на сервисе носит справочный характер и не является юридической консультацией. Для принятия юридических решений обращайтесь к квалифицированному специалисту.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Ограничение ответственности</h2>
          <p>Сервис предоставляется «как есть». Мы не несём ответственности за решения, принятые на основании информации, размещённой на сервисе.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Интеллектуальная собственность</h2>
          <p>Все материалы сервиса защищены авторским правом. Копирование и распространение без разрешения запрещены.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Контакты</h2>
          <p>По вопросам использования сервиса обращайтесь: info@babijon.by</p>
        </section>
      </div>
    </div>
  );
}
