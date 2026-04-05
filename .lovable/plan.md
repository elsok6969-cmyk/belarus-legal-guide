

# Edge Function для импорта документов из pravo.by

## Обзор
Создать edge function `import-documents` для автоматического импорта кодексов Беларуси, таблицу `import_logs` для логирования, добавить `content_hash` в `documents`, и настроить ежедневный cron.

## Шаг 1. Миграция базы данных

- Создать таблицу `import_logs` (id, type, limit_count, status, imported, updated, errors, duration_ms, error_message, started_at, completed_at)
- RLS: только service_role может читать/писать
- Добавить колонку `content_hash text` в `documents`

## Шаг 2. Edge Function `supabase/functions/import-documents/index.ts`

Основная логика из запроса пользователя с доработками:
- CORS headers для совместимости
- Список 26 кодексов с кодами pravo.by и slug
- `fetchDocumentMeta()` — парсинг HTML с pravo.by (title, date_adopted, reg_number, organ)
- `fetchDocumentText()` — получение markdown через Firecrawl API (если ключ есть)
- SHA-256 хеширование для определения изменений
- Upsert логика: insert новых / update изменённых по slug
- Rate limiting (500ms между запросами)
- Логирование в `import_logs`
- Авторизация через Bearer token (`IMPORT_SECRET`)

**Отличия от пользовательского кода:**
- Добавлены CORS headers
- Используется `Deno.serve` вместо устаревшего `serve` из std
- Колонка в import_logs называется `limit_count` (не `limit` — зарезервированное слово)

## Шаг 3. Секреты

Запросить у пользователя два секрета:
1. **IMPORT_SECRET** — произвольная строка для авторизации cron-вызовов
2. **FIRECRAWL_API_KEY** — ключ Firecrawl (опционален, без него текст не скачивается)

Firecrawl доступен как коннектор, но у пользователя нет подключений — предложу подключить или ввести ключ вручную.

## Шаг 4. Cron-задача

Использовать `pg_cron` + `pg_net` для ежедневного вызова в 03:00 UTC:
```sql
SELECT cron.schedule('daily-import', '0 3 * * *', $$
  SELECT net.http_post(
    url := 'https://zqcuqodccbpwawtlrafw.supabase.co/functions/v1/import-documents',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <IMPORT_SECRET>"}'::jsonb,
    body := '{"type":"codex","limit":26}'::jsonb
  ) AS request_id;
$$);
```
Это будет выполнено через insert tool (не миграцию), так как содержит пользовательские данные.

## Затрагиваемые файлы
- Миграция SQL — `import_logs` table + `content_hash` column
- `supabase/functions/import-documents/index.ts` — новый
- Cron SQL — через insert tool после получения IMPORT_SECRET

## Порядок действий
1. Миграция (import_logs + content_hash)
2. Создать edge function
3. Запросить IMPORT_SECRET и FIRECRAWL_API_KEY
4. После получения секретов — настроить cron

