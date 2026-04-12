

## Plan: Revamp Profile & Subscription Pages

### Database Migration
Add 3 columns to `user_profiles` and 2 columns to `subscription_requests`:

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS unp text;

ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS unp text;
```

Update profession validator to include `'other'`:
```sql
CREATE OR REPLACE FUNCTION public.validate_user_profile_profession() ...
  -- add 'other' to the allowed list
```

### ProfilePage.tsx — Full Rewrite

**Form fields** (top to bottom):
1. Имя (`full_name`) — text input
2. Фамилия (`last_name`) — text input (new)
3. Email — readonly, bg-muted
4. Телефон (`phone`) — text input, placeholder "+375 29 123 45 67" (new)
5. Профессия — select (add "Другое" option with value `other`)
6. Организация (`company_name`) — text input
7. УНП (`unp`) — text input, placeholder "123456789" (new)

**Save button** → updates all fields in `user_profiles`, toast "Данные сохранены"

**Security section:**
- "Сменить пароль" button — sends reset email (keep existing logic)
- "Удалить аккаунт" — red outline button → AlertDialog with double confirmation ("Вы уверены?" → type "УДАЛИТЬ" to confirm) → calls edge function or disables account

**Remove** the subscription card from ProfilePage (it belongs on SubscriptionPage).

### SubscriptionPage.tsx — Full Rewrite

**Current plan card** (top):
- "Ваш план: Пробный (бесплатный)" / "Персональный" / "Корпоративный"
- Expiry date if paid plan
- Usage limits section (keep existing)

**Plan selection** (below, inline — no redirect to /pricing):
- Two plan cards side by side: Персональный (69 BYN/мес) and Корпоративный (99 BYN/мес)
- Each with feature list and "Оставить заявку" button
- Current plan card shows "Текущий план" badge, button disabled

**Request form** (Dialog or inline section when plan selected):
- Pre-filled from profile: name, email, phone
- For Корпоративный: show Организация + УНП fields (pre-filled from profile if available)
- Submit → insert into `subscription_requests` with user_id, plan, full_name, email, phone, company_name, unp
- Success: show "Спасибо! Мы свяжемся с вами для оформления подписки." toast + disable button

### Files to modify
1. **Database migration** — add columns to `user_profiles` and `subscription_requests`, update profession validator
2. **src/pages/account/ProfilePage.tsx** — add new fields, remove subscription card, add delete account
3. **src/pages/account/SubscriptionPage.tsx** — inline plan cards + request form instead of redirect to /pricing

