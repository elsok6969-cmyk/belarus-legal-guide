

# Plan: Enrich Landing Page, Fix Currency Widget, Create /currencies Page

## Summary
Three changes: (1) expand the landing page with 6 new content sections, (2) ensure currency rates load with fallback, (3) create a full /currencies page with converter and table.

## 1. Landing Page — Add Content Sections

**File: `src/pages/Landing.tsx`** — Major rewrite adding these sections in order:

1. **HERO** — keep as-is
2. **Dark Informers Bar** (NEW) — navy-900 background horizontal strip with economic indicators fetched from `economic_indicators` table + top currencies from `currency_rates`. Shows: refinancing rate, minimum wage, base amount, USD, EUR. Horizontally scrollable on mobile. Click currency → `/currencies`, click indicator → tooltip with update date.
3. **Popular Documents** (NEW) — two-column layout:
   - Left (60%): "Кодексы РБ" — hardcoded list of 8 popular codexes with emoji icons, linked to their document pages. "Все 26 кодексов →" link at bottom.
   - Right (40%): "Последние документы" — query `documents` table ORDER BY `created_at` DESC LIMIT 5, show badge + truncated title + date. "Все документы →" link.
4. **Features Grid** (REPLACE existing 3-card section) — expand to 2x3 grid (6 cards) with the specified content (search, article focus, AI, cross-references, calendar, rates).
5. **Currency Cards** (NEW) — 4-column grid showing USD, EUR, RUB, CNY with flag emoji, large rate, change indicator, and mini sparkline from `currency_rates` history. "Все курсы и конвертер →" button → `/currencies`.
6. **Deadlines** — keep existing but fetch 6 items instead of 4.
7. **"Для кого Бабиджон"** (NEW) — horizontal row of 6 clickable profession pills with hover descriptions. Links to `/app/guide`.
8. **Pricing** — keep as-is.

**Data queries to add:**
- `economic_indicators` for refinancing rate, base amount, minimum wage
- `documents` ORDER BY created_at DESC LIMIT 5 for "latest documents"
- Extended `currency_rates` query for sparkline history (last 7 days for 4 currencies)

## 2. Fix Currency Widget on Landing

In `Landing.tsx`, the rates query already exists but may return empty. Add:
- Fallback UI: if rates are empty/error, show "Курсы временно недоступны" instead of hiding the section
- Keep the existing query but also fetch CNY in addition to USD/EUR/RUB

## 3. New /currencies Page

**File: `src/pages/PublicCurrencies.tsx`** — new public page replacing the old `PublicRates.tsx`:

- **Header**: h1 "Курсы валют НБРБ", subtitle with latest date from data
- **Converter card** (gray-50 background): Two large input fields (amount + currency selector) with ⇄ swap button + readonly BYN result. Instant calculation using `rate`. Supports reverse conversion.
- **Search filter**: small input "Найти валюту..." for client-side filtering
- **Rates table**: columns — Flag+Code, Currency name, Rate (BYN), Change (colored ▲/▼), 7-day sparkline SVG. Priority sort: USD, EUR, RUB, CNY, PLN, UAH, GBP first, then alphabetical.
- **Source attribution** at bottom

Uses existing `currency_rates` table. Sparkline data from grouping rates by `rate_date` (multiple dates already stored by cron).

**File: `src/App.tsx`** — add route `/currencies` → `PublicCurrencies` in PublicLayout. Keep `/rates` as redirect to `/currencies`.

**File: `src/components/layout/PublicHeader.tsx`** — add "Курсы" nav link pointing to `/currencies`.

**File: `src/components/layout/PublicFooter.tsx`** — update "Курсы НБРБ" link from `/rates` to `/currencies`.

## Technical Details

- All data comes from existing tables: `currency_rates`, `economic_indicators`, `documents`, `deadline_calendar`
- No DB migrations needed
- MiniSparkline component will be shared/inlined in both Landing and PublicCurrencies
- Flag emoji map: `{ USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳', PLN: '🇵🇱', UAH: '🇺🇦', GBP: '🇬🇧' }`
- Converter formula: `amount * rate` (forward), `amount / rate` (reverse)
- All styling uses existing navy/amber/gray CSS variables

## Files Changed
- `src/pages/Landing.tsx` — major rewrite (add 4 new sections, expand features to 6)
- `src/pages/PublicCurrencies.tsx` — new file
- `src/App.tsx` — add `/currencies` route, redirect `/rates`
- `src/components/layout/PublicHeader.tsx` — add "Курсы" nav link
- `src/components/layout/PublicFooter.tsx` — update rates link

