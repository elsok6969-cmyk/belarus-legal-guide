import { DisclaimerFull } from '@/components/shared/Disclaimers';
import { PageSEO } from '@/components/shared/PageSEO';

export default function Legal() {
  return (
    <div>
      <PageSEO title="Правовая информация" description="Отказ от ответственности, условия использования и политика конфиденциальности." path="/legal" />
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

          <div id="terms">
            <h2 className="text-2xl font-bold tracking-tight">Условия использования</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Используя платформу Право&nbsp;БY, вы соглашаетесь с тем, что предоставленная 
                информация носит справочный характер и не является юридической консультацией.
              </p>
              <p>
                Платформа предоставляет доступ к текстам нормативных правовых актов и инструментам 
                для работы с ними. AI-ассистент формирует ответы автоматически на основе содержимого 
                базы документов. Ответы могут содержать неточности или быть неполными.
              </p>
              <p>
                Вы несёте ответственность за самостоятельную проверку информации перед принятием 
                любых решений. Платформа не несёт ответственности за последствия, возникшие в 
                результате использования предоставленных материалов.
              </p>
              <p>
                Полные условия использования будут опубликованы в ближайшее время.
              </p>
            </div>
          </div>

          <div id="privacy">
            <h2 className="text-2xl font-bold tracking-tight">Политика конфиденциальности</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Мы собираем минимально необходимые данные для функционирования платформы: 
                адрес электронной почты и данные, которые вы указываете при регистрации.
              </p>
              <p>
                Ваши поисковые запросы и взаимодействия с AI-ассистентом могут сохраняться 
                для улучшения качества сервиса. Мы не передаём персональные данные третьим 
                лицам без вашего согласия.
              </p>
              <p>
                Полная политика конфиденциальности будет опубликована в ближайшее время.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
