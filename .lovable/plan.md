

# Plan: Calculator Catalog + 5 Calculators

## Overview
Create a calculator catalog page at `/app/calculator` and 5 individual calculator pages, each with live-updating results, copy/print, and responsive two-column layout.

## Steps

### 1. Create calculator catalog page — `src/pages/Calculators.tsx`
- Grid of cards grouped by category (Зарплата, Налоги, Аренда, Трудовые отношения, Прочие)
- Each card: Lucide icon + title + short description, links to `/app/calculator/:slug`
- Search/filter input at top

### 2. Create 5 calculator components in `src/pages/calculators/`

Each calculator shares a common layout pattern:
- Left: form inputs, Right: result card (stacked on mobile)
- Results update live on input change (no submit button)
- Reset button, Copy result, Print button
- Footer with legal reference and date

**Files:**
- `src/pages/calculators/IncomeTaxCalc.tsx` — Income tax with year selection, standard/child/dependent deductions, 13% rate
- `src/pages/calculators/VacationPayCalc.tsx` — Vacation pay from average daily wage or 12-month salaries, minus income tax
- `src/pages/calculators/TaxPenaltyCalc.tsx` — Penalty calculation using refinancing rate from `economic_indicators` table, days × rate/360
- `src/pages/calculators/VatCalc.tsx` — VAT extract/add with 20/10/25/0% rates
- `src/pages/calculators/WorkExperienceCalc.tsx` — Dynamic table of work periods, summed into years/months/days

### 3. Add routes to `App.tsx`
- `/app/calculator` → Calculators catalog
- `/app/calculator/:slug` → Router component that maps slug to calculator

### 4. Update sidebar link
- Point "Калькуляторы" in `AppSidebar.tsx` to `/app/calculator`

## Technical Details

- Tax penalty fetches refinancing rate: `supabase.from('economic_indicators').select('current_value').eq('slug', 'refinancing-rate').single()`
- Income tax deduction values for 2024/2025/2026 stored as constants in component
- Work experience uses date-fns `differenceInDays` for period calculation
- Copy uses `navigator.clipboard.writeText`, print uses `window.print()` with print-specific CSS
- All formatters use `Intl.NumberFormat('ru-RU')` for BYN formatting

### Files to create/modify
- **Create**: `src/pages/Calculators.tsx` (catalog)
- **Create**: `src/pages/calculators/IncomeTaxCalc.tsx`
- **Create**: `src/pages/calculators/VacationPayCalc.tsx`
- **Create**: `src/pages/calculators/TaxPenaltyCalc.tsx`
- **Create**: `src/pages/calculators/VatCalc.tsx`
- **Create**: `src/pages/calculators/WorkExperienceCalc.tsx`
- **Modify**: `src/App.tsx` (add routes)
- **Modify**: `src/components/layout/AppSidebar.tsx` (update link)

