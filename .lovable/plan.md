

# Профессиональный AI-ассистент с привязкой к базе НПА

## Обзор
Создать новую edge function `ai-assistant` с поиском по базе документов, лимитами запросов и отображением источников. Переработать UI чата с 6 примерами, счётчиком лимитов и ссылками на НПА.

## Решения по архитектуре

- **Не создаём `ai_chat_history`** — уже есть `assistant_conversations` + `assistant_messages` с RLS. Добавим колонку `sources` в `assistant_messages` (уже есть — `jsonb DEFAULT '[]'`). Переиспользуем.
- **Lovable AI вместо OpenAI** — проект уже использует Lovable AI Gateway. OpenAI из запроса заменяется на `ai.gateway.lovable.dev`.
- **Streaming сохраняется** — edge function делает поиск документов, проверяет лимиты, затем стримит ответ. Источники возвращаются в отдельном SSE-событии перед стримом.
- **Профиль: `user_id`** — в таблице `profiles` ключ `user_id`, не `id`. Лимиты проверяются по `user_id`.

## Шаг 1. Edge Function `ai-assistant`

Новый файл `supabase/functions/ai-assistant/index.ts`:

1. Извлечь JWT из заголовка, получить user через `supabase.auth.getUser(token)`
2. Загрузить профиль (`plan`, `ai_requests_today`, `ai_requests_reset_at`) по `user_id`
3. Сбросить счётчик если новый день; проверить лимит (free = 5/день)
4. Принять `question` + `session_id`; поиск по `documents.fts` (русская конфигурация, limit 3)
5. Собрать контекст из найденных документов (первые 1500 символов body_text)
6. Загрузить историю сессии (последние 10 сообщений из `assistant_messages`)
7. Отправить SSE-событие `data: {"sources": [...]}` с найденными документами
8. Стримить ответ через Lovable AI Gateway (`google/gemini-3-flash-preview`)
9. После стрима — сохранить оба сообщения в `assistant_messages`, инкрементировать счётчик

Лимит-ответ (429): JSON с `error: 'limit_exceeded'`, `requests_used`, `requests_limit`.

## Шаг 2. Переработка UI (`src/pages/AIChat.tsx`)

- Убрать боковую панель разговоров (упростить до session-based)
- Шапка: «AI-ассистент» + счётчик запросов (прогресс-бар) + кнопка «Новый диалог»
- Пустой чат: 6 карточек-примеров в `grid-cols-2 md:grid-cols-3`
- Сообщения: user (справа, bg-teal-600) / assistant (слева, bg-muted) с markdown
- Блок источников под ответом ассистента: ссылки на `/documents/{slug}`
- Анимация загрузки: три точки (bounce)
- Баннер лимита: textarea disabled + предложение апгрейда
- Redirect на `/auth?return=/ai-assistant` если не авторизован

## Шаг 3. Обновить маршрут

В `App.tsx`: добавить `/ai-assistant` как публичный роут с AuthGuard (редирект на /auth). Оставить `/app/assistant` как алиас.

## Затрагиваемые файлы
- `supabase/functions/ai-assistant/index.ts` — новый
- `src/pages/AIChat.tsx` — полная переработка
- `src/App.tsx` — добавить маршрут `/ai-assistant`

Существующая edge function `chat` остаётся без изменений (может использоваться как fallback). Миграции БД не нужны — все таблицы и колонки уже существуют.

