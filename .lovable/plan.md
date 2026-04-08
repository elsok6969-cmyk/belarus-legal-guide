

# Plan: Public Calculators + Calendar Fix

## Problem
1. `/calculator` returns 404 — calculators only exist at `/app/calculator` (behind AppLayout)
2. `/app/calendar` (DeadlinesCalendar) shows skeletons — the `deadlines` table has data (50 rows) but the "Public read deadlines" RLS policy is restricted to `authenticated` role. If user isn't logged in or session expired, data won't load. Also the calendar dots only show a single red dot regardless of deadline type.

## Changes

### 1. Public Calculator Routes (App.tsx)
Add three new public routes:
- `/calculator` → new `PublicCalculators` page (catalog)
- `/calculator/nds` → reuse existing `VatCalc` (update back-link to `/calculator`)
- `/calculator/income-tax` → reuse existing `IncomeTaxCalc` (update back-link)

All wrapped in `PublicLayout`.

### 2. Public Calculator Catalog (new: `src/pages/PublicCalculators.tsx`)
- Title: "Калькуляторы", subtitle: "Онлайн-расчёты для бухгалтеров и предпринимателей"
- 3-column grid with 6 cards (NDS, Income Tax work; 4 others show "Скоро" badge, greyed out, non-clickable)
- Cards link to `/calculator/nds` and `/calculator/income-tax`

### 3. Update Calculator Back-Links
Modify `VatCalc.tsx` and `IncomeTaxCalc.tsx`:
- Change the back-link from `/app/calculator` to detect if current URL starts with `/app/` and link accordingly, OR simply use `window.history.back()` / a relative approach
- Simpler: add a `basePath` prop or just update the SEO path dynamically

Actually, the cleanest approach: create wrapper components or just add public routes that render the same components. The existing calculators already link to `/app/calculator` — we need to make them work from both `/app/calculator/vat` and `/calculator/nds`. 

Better approach: Update `VatCalc` and `IncomeTaxCalc` to detect their route context and adjust back-links. Use `useLocation` to check if path starts with `/app/`.

### 4. Calendar Fix — RLS Policy (Migration)
The `deadlines` table "Public read deadlines" policy is for `authenticated` only. The `/app/calendar` page is inside AppLayout so user should be authenticated. But if skeletons are showing, the query might be failing silently.

Update the `DeadlinesCalendar` component to handle errors properly and add proper error state. Also update the RLS to allow `public` role read access (same as other reference tables).

```sql
DROP POLICY IF EXISTS "Public read deadlines" ON deadlines;
CREATE POLICY "Public read deadlines" ON deadlines FOR SELECT TO public USING (true);
```

### 5. Calendar Dots — Color by Type
Currently `DeadlinesCalendar.tsx` shows a single dot color (red for future, muted for past). Update to show color based on `deadline_type`:
- `tax` → red dot
- `reporting` → orange dot  
- `general` → blue dot

Show up to 3 dots per day (one per unique type present).

## Files

| Action | File |
|--------|------|
| Create | `src/pages/PublicCalculators.tsx` — catalog page |
| Modify | `src/App.tsx` — add 3 public calculator routes |
| Modify | `src/pages/calculators/VatCalc.tsx` — adaptive back-link |
| Modify | `src/pages/calculators/IncomeTaxCalc.tsx` — adaptive back-link |
| Modify | `src/pages/DeadlinesCalendar.tsx` — multi-color dots, error handling |
| Migration | Fix deadlines RLS to `public` role |

