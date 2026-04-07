
-- Create form_documents table
CREATE TABLE public.form_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  file_url text,
  file_type text DEFAULT 'pdf',
  file_size integer,
  tags text[] DEFAULT '{}',
  is_fillable boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for category
CREATE OR REPLACE FUNCTION public.validate_form_category()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category NOT IN ('tax_reporting','accounting','hr','procurement','corporate','contracts','ecology','powers_of_attorney') THEN
    RAISE EXCEPTION 'Invalid form category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_form_category
  BEFORE INSERT OR UPDATE ON public.form_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_form_category();

-- Updated_at trigger
CREATE TRIGGER trg_form_documents_updated_at
  BEFORE UPDATE ON public.form_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.form_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read form_documents" ON public.form_documents
  FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage form_documents" ON public.form_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manage form_documents" ON public.form_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO public.form_documents (category, title, description, file_type, tags, is_fillable) VALUES
('tax_reporting', 'Налоговая декларация по НДС', 'Форма налоговой декларации (расчёта) по налогу на добавленную стоимость', 'xlsx', ARRAY['НДС','налог','декларация'], true),
('tax_reporting', 'Налоговая декларация по налогу на прибыль', 'Форма декларации по налогу на прибыль для организаций', 'xlsx', ARRAY['прибыль','налог','декларация'], true),
('tax_reporting', 'Налоговая декларация по подоходному налогу', 'Форма декларации по подоходному налогу для физических лиц', 'xlsx', ARRAY['подоходный','НДФЛ','декларация'], true),
('tax_reporting', 'Форма 4-фонд (отчёт в ФСЗН)', 'Отчёт о средствах бюджета государственного внебюджетного ФСЗН', 'xlsx', ARRAY['ФСЗН','фонд','отчёт'], true),
('tax_reporting', 'Форма 4-страхование (Белгосстрах)', 'Отчёт о начисленных страховых взносах по обязательному страхованию', 'xlsx', ARRAY['страхование','Белгосстрах','отчёт'], true),
('tax_reporting', 'Расчёт по земельному налогу', 'Форма расчёта по земельному налогу для юридических лиц', 'xlsx', ARRAY['земля','налог','расчёт'], false),
('tax_reporting', 'Декларация по налогу на недвижимость', 'Форма декларации по налогу на недвижимость организаций', 'xlsx', ARRAY['недвижимость','налог','декларация'], false),
('accounting', 'Бухгалтерский баланс', 'Форма бухгалтерского баланса (форма 1)', 'xlsx', ARRAY['баланс','отчётность','форма 1'], true),
('accounting', 'Отчёт о прибылях и убытках', 'Форма отчёта о прибылях и убытках (форма 2)', 'xlsx', ARRAY['прибыль','убытки','форма 2'], true),
('accounting', 'Авансовый отчёт', 'Форма авансового отчёта подотчётного лица', 'xlsx', ARRAY['аванс','подотчёт','отчёт'], true),
('accounting', 'Приходный кассовый ордер', 'Форма ПКО для оформления поступления наличных', 'xlsx', ARRAY['касса','ПКО','наличные'], true),
('accounting', 'Расходный кассовый ордер', 'Форма РКО для оформления выдачи наличных', 'xlsx', ARRAY['касса','РКО','наличные'], true),
('accounting', 'Товарно-транспортная накладная (ТТН-1)', 'Форма ТТН-1 для перемещения товаров', 'xlsx', ARRAY['ТТН','накладная','транспорт'], false),
('hr', 'Приказ о приёме на работу', 'Типовая форма приказа (распоряжения) о приёме работника', 'docx', ARRAY['приём','приказ','кадры'], true),
('hr', 'Приказ об увольнении', 'Типовая форма приказа (распоряжения) о прекращении трудового договора', 'docx', ARRAY['увольнение','приказ','кадры'], true),
('hr', 'Трудовой договор (контракт)', 'Примерная форма трудового договора (контракта) с работником', 'docx', ARRAY['контракт','договор','труд'], true),
('hr', 'Приказ о предоставлении отпуска', 'Форма приказа о предоставлении трудового отпуска работнику', 'docx', ARRAY['отпуск','приказ','кадры'], true),
('hr', 'Штатное расписание', 'Форма штатного расписания организации', 'xlsx', ARRAY['штатное','расписание','кадры'], true),
('hr', 'Табель учёта рабочего времени', 'Форма табеля учёта использования рабочего времени', 'xlsx', ARRAY['табель','рабочее время','учёт'], true),
('hr', 'Личная карточка работника', 'Форма личной карточки для учёта кадров', 'docx', ARRAY['личная карточка','кадры','учёт'], false),
('procurement', 'Приглашение к участию в процедуре закупки', 'Типовая форма приглашения для участников закупок', 'docx', ARRAY['закупки','приглашение','тендер'], false),
('procurement', 'Протокол заседания комиссии по закупкам', 'Форма протокола заседания конкурсной комиссии', 'docx', ARRAY['закупки','протокол','комиссия'], false),
('corporate', 'Протокол общего собрания участников ООО', 'Типовая форма протокола общего собрания', 'docx', ARRAY['ООО','собрание','протокол'], false),
('corporate', 'Устав ООО (типовой)', 'Типовая форма устава общества с ограниченной ответственностью', 'docx', ARRAY['устав','ООО','регистрация'], false),
('contracts', 'Договор купли-продажи', 'Типовая форма договора купли-продажи товаров', 'docx', ARRAY['договор','купля-продажа','сделка'], true),
('contracts', 'Договор подряда', 'Типовая форма договора подряда на выполнение работ', 'docx', ARRAY['договор','подряд','работы'], true),
('contracts', 'Договор аренды нежилого помещения', 'Типовая форма договора аренды нежилого помещения', 'docx', ARRAY['аренда','договор','помещение'], true),
('powers_of_attorney', 'Доверенность на получение ТМЦ', 'Форма доверенности на получение товарно-материальных ценностей', 'docx', ARRAY['доверенность','ТМЦ','получение'], true),
('powers_of_attorney', 'Генеральная доверенность', 'Форма генеральной доверенности на представление интересов', 'docx', ARRAY['доверенность','генеральная','представительство'], false),
('ecology', 'Экологический отчёт формы ПОД-9', 'Форма первичного учёта отходов производства', 'xlsx', ARRAY['экология','отходы','ПОД-9'], false),
('ecology', 'Отчёт по форме 1-ОС (воздух)', 'Форма отчёта об охране атмосферного воздуха', 'xlsx', ARRAY['экология','воздух','1-ОС'], false);
