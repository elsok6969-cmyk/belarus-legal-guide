

# Plan: Professional Dashboard for `/app` (Index page)

## Overview
Complete rewrite of `Index.tsx` into a professional dashboard with enhanced TopBar (search + economic indicators + notifications), horizontal quick-nav carousel, and two-column content layout with recommendations, new documents, articles, favorites, history, and mini calendar.

## Steps

### 1. Enhance `TopBar.tsx`
- Add functional search input that navigates to `/app/search?q=...` on Enter
- Add economic indicators strip from `economic_indicators` table (with tooltips showing `effective_date`)
- Add notification bell with unread count badge from `user_notifications`
- Keep profile dropdown

### 2. Rewrite `Index.tsx` — full dashboard

**Horizontal nav bar** (below TopBar, inside page):
- Icon buttons for: Кодексы, Новые документы, Проводник, Калькуляторы, Формы, Классификаторы, Календарь, Справочная, AI-помощник
- Links to corresponding `/app/*` routes (or opens chat for AI)
- Horizontal scroll on mobile with overflow-x-auto

**Two-column layout** (70/30 on desktop, stacked on mobile):

Left column:
- **"Рекомендации для вас"** — if user has `profession` in `user_profiles`, fetch recent documents matching profession tags. Show 5 items with type badge + title + date.
- **"Новые документы"** — Tabs (Все | by document_type slugs). List of 10 latest documents with type badge, title, date, issuing body. Link to "Все новые документы →"
- **"Статьи и обзоры"** — 4 latest published articles from `articles` table, horizontal cards with title + excerpt + date

Right column:
- **"Важнейшие НПА"** — hardcoded list of key documents (ГК, НК, ТК, etc.) linking to search/documents
- **"Мои избранные"** — from `user_favorites` joined with `documents`, last 5
- **"Последние просмотренные"** — from `user_document_history` joined with `documents`, last 5
- **"Календарь дедлайнов"** — mini Calendar component from shadcn showing current month, days with deadlines marked, click to see deadlines list

All blocks have skeleton loaders while loading.

### 3. Files to modify
- **Rewrite**: `src/pages/Index.tsx` — complete new dashboard
- **Modify**: `src/components/layout/TopBar.tsx` — add search navigation, indicators, notification bell

## Technical Details

- Economic indicators query: `supabase.from('economic_indicators').select('*')` — display 3-4 key ones (by slug: refinancing-rate, min-salary, base-value)
- Notifications: `supabase.from('user_notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)` for badge count
- Recommendations: query `documents` ordered by `created_at` desc, optionally filtered by document_type matching profession (simple mapping object in code)
- New documents tabs: fetch `document_types` for tab labels, filter documents by type on tab change
- Mini calendar: use shadcn `Calendar` component, query `deadline_calendar` for current month, highlight days with deadlines using `modifiers`
- Search in TopBar: `useNavigate` to `/app/search?q=${encodeURIComponent(value)}` on Enter key

