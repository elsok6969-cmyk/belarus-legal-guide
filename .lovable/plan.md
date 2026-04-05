

# Система профилей, подписок и авторизации

## Обзор
Создать новые таблицы (profiles с планами, user_favorites, view_history, user_subscriptions, subscription_requests), переработать страницы авторизации (/auth с табами), профиля (/profile) и подписок (/subscription). Обновить триггер handle_new_user.

## Важные решения по схеме

Уже существует таблица `profiles` с колонками `id, user_id, display_name, avatar_url, created_at, updated_at`. Также существуют таблицы `bookmarks` и `subscriptions`. Предлагаю:

1. **Не создавать дублирующие таблицы** (`user_favorites` → использовать существующую `bookmarks`, `user_subscriptions` → использующую `subscriptions`)
2. **Расширить существующую `profiles`** — добавить колонки `plan`, `plan_expires_at`, `ai_requests_today`, `ai_requests_reset_at`, `full_name`
3. **Создать только новые таблицы**: `view_history`, `subscription_requests`
4. **Обновить триггер** `handle_new_user` чтобы заполнять email

## Шаг 1. Миграция базы данных

**Расширить `profiles`:**
- `plan text DEFAULT 'free'` (без CHECK — используем валидацию триггером)
- `plan_expires_at timestamptz`
- `ai_requests_today integer DEFAULT 0`
- `ai_requests_reset_at date DEFAULT CURRENT_DATE`
- `full_name text`
- `email text`

**Создать `view_history`:**
- `id uuid PK`, `user_id uuid`, `document_id uuid`, `viewed_at timestamptz DEFAULT now()`
- RLS: `auth.uid() = user_id` для ALL
- Индекс на `(user_id, viewed_at DESC)`

**Создать `subscription_requests`:**
- `id uuid PK`, `user_id uuid`, `plan text`, `full_name text`, `email text`, `phone text`, `status text DEFAULT 'pending'`, `created_at timestamptz`
- RLS: authenticated INSERT own + SELECT own

**Обновить триггер** `handle_new_user` — добавить `email` в INSERT

**Валидационный триггер** для `profiles.plan` — проверять допустимые значения (free, standard, pro, business)

## Шаг 2. Страница `/auth` — объединённая авторизация

Новый файл `src/pages/Auth.tsx`:
- Табы: «Войти» | «Регистрация»
- Вход: email + пароль, ссылка «Забыли пароль?», Google OAuth (через `lovable.auth.signInWithOAuth`)
- Регистрация: email + пароль + подтверждение пароля + чекбокс условий, Google OAuth
- Валидация: email формат, пароль ≥ 8, подтверждение совпадает
- После регистрации: сообщение «Проверьте email»
- Редирект на `/profile` если уже авторизован

## Шаг 3. Страница `/auth/reset-password` — сброс пароля

`src/pages/ResetPassword.tsx`:
- Форма ввода нового пароля
- Проверка `type=recovery` в URL hash
- Вызов `supabase.auth.updateUser({ password })`

## Шаг 4. Страница `/profile` — профиль пользователя

`src/pages/Profile.tsx` (за AuthGuard):
- **Карточка тарифа**: название плана, дата окончания, прогресс-бар AI-запросов (для free), кнопка «Улучшить»
- **4 вкладки (Tabs)**:
  1. Закладки — из `bookmarks JOIN documents`, удаление
  2. История — из `view_history JOIN documents` (20 последних), кнопка «Очистить»
  3. Подписки — из `subscriptions JOIN documents`, отписка
  4. Настройки — имя (editable), email (readonly), смена пароля, удаление аккаунта

## Шаг 5. Страница `/subscription` — тарифы

`src/pages/Subscription.tsx`:
- 4 карточки (free/standard/pro/business) с ценами в BYN
- «Профи» выделен border-2 + badge «Популярный»
- Текущий тариф пользователя подсвечен
- Кнопка «Подключить» → диалог с формой (имя, email, телефон)
- Заявка сохраняется в `subscription_requests`

## Шаг 6. Обновить маршруты (`App.tsx`)

- `/auth` → Auth (заменить /login и /register)
- `/auth/reset-password` → ResetPassword
- `/profile` → Profile (с AuthGuard)
- `/subscription` → Subscription
- Сохранить старые /login, /register как редиректы на /auth

## Затрагиваемые файлы
- Миграция SQL (profiles extension, view_history, subscription_requests, trigger update)
- `src/pages/Auth.tsx` — новый
- `src/pages/ResetPassword.tsx` — новый
- `src/pages/Profile.tsx` — новый
- `src/pages/Subscription.tsx` — новый
- `src/App.tsx` — новые маршруты
- `src/components/layout/PublicHeader.tsx` — обновить ссылки на /auth

## Технические детали
- Google OAuth через `lovable.auth.signInWithOAuth("google", ...)` (Lovable Cloud managed)
- Существующие `bookmarks` и `subscriptions` используются вместо дублирующих таблиц
- Clipboard API не нужен — используется для /profile только DB-операции
- Удаление аккаунта: показать предупреждение, фактическое удаление требует edge function (заглушка с toast)

