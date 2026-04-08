

# Plan: Fix 5 Bugs on Belarus Legal Platform

## Diagnosis Summary

After querying the database and reviewing the code, here's the actual state of each bug:

| Bug | Reported Issue | Actual Finding |
|-----|---------------|----------------|
| 1. Search hangs | "трудовой договор" infinite skeletons | SQL function works (returns results in <1s). Client already has 10s abort timeout. **May still hang on very large result sets or slow connections.** Will add `SET statement_timeout` inside the SQL function as extra safety. |
| 2. "205 ук" | Doesn't find article 205 | **Already works.** SQL returns "Статья 205." correctly. The `search_all` function already handles trailing periods. No change needed. |
| 3. /currencies | Data not loading | 46 rows exist, RLS policy "Rates readable by everyone" already in place. **Data loads fine.** Will add NBRB API fallback and error handling as defensive improvement. |
| 4. Calendar markers | No dots on dates | `deadlines` table has 50 rows, `tax_deadlines` has 35 rows. Both have public RLS. **Data loads fine.** Will add error state handling for robustness. |
| 5. Hero too big | Takes too much screen | Hero has `py-[70px]` (140px total padding!) plus `text-5xl` heading. **Confirmed — needs compression.** |

## Changes

### 1. Search robustness — `search_all` SQL function + client
**Migration**: Add `SET statement_timeout = '8000'` at the top of `search_all` to prevent runaway queries. Reset at the end.

**`src/pages/PublicDocuments.tsx`**: Already has abort controller. Will add `staleTime` and ensure error state renders properly (already does — no change needed).

### 2. "205 ук" — No changes needed
Already works correctly. The function matches `Статья 205.` format.

### 3. /currencies — Add NBRB API fallback
**`src/pages/Currencies.tsx`**: Add error handling to the query and a fallback fetch to `https://api.nbrb.by/exrates/rates?periodicity=0` when Supabase returns empty data. Map NBRB API fields to match the component's expected format.

### 4. Calendar — Add error handling
**`src/pages/DeadlinesCalendar.tsx`** and **`src/pages/PublicCalendar.tsx`**: Add `isError` state handling to show a message instead of infinite skeletons if the query fails.

### 5. Hero compression
**`src/pages/Landing.tsx`**: 
- Remove `py-[70px]`, set `pt-8 pb-6` (32px top, 24px bottom)
- Title: `text-2xl md:text-[32px]` (was text-3xl md:text-5xl), keep "бесплатно" inline
- Subtitle: `text-base` (was text-lg)
- Search margin: `mt-5` (20px)
- Tags margin: `mt-3` (12px)  
- Gap to content below: `mb-6` (24px)

## Files Changed

| Action | File |
|--------|------|
| Migration | Add `statement_timeout` to `search_all` function |
| Modify | `src/pages/Currencies.tsx` — NBRB API fallback |
| Modify | `src/pages/DeadlinesCalendar.tsx` — error state |
| Modify | `src/pages/PublicCalendar.tsx` — error state |
| Modify | `src/pages/Landing.tsx` — hero compression |

