

# Plan: Full-Text Search with PostgreSQL Functions

## Overview
Replace the current `ilike`-based search with proper PostgreSQL full-text search using `ts_vector`/`ts_query`, add advanced filters, snippet highlighting, pagination, and URL sync. Two DB functions + rewritten `AppSearch.tsx`.

## Steps

### 1. Database migration — two search functions

**`search_documents`**: Accepts query, filters (type slug, status, date range, issuing body, exact_match, title_only), limit/offset. Returns joined results with `ts_headline` snippets, `ts_rank_cd` ranking, and `total_count` via window function. Uses `websearch_to_tsquery('russian', ...)` by default, `phraseto_tsquery` for exact match. Falls back to `ilike` on title if query is empty (browse mode).

**`search_within_document`**: Accepts document_id + query. Searches `document_sections.content_text` with snippets and ranking. For use inside the document viewer.

### 2. Rewrite `AppSearch.tsx`

Replace the entire page with a new implementation:

- **URL sync**: Read/write `q`, `type`, `status`, `exact`, `title_only`, `date_from`, `date_to`, `body`, `page` from `useSearchParams`. On mount, if `q` exists, auto-search.
- **Search bar**: Large input with Search icon, submit on Enter/button click. Below it, collapsible "Расширенный поиск" panel.
- **Advanced filters panel** (hidden by default, toggled by link):
  - Checkboxes: "Точное совпадение", "Искать только в названии"
  - Select: document type (from `document_types` table)
  - Input: issuing body name
  - Date range: two date inputs (от — до)
  - Select: status
- **Results**: Count header, cards with type badge + status badge, title as link to `/app/documents/:id`, metadata row (number, date, issuing body), snippet with `<mark>` rendered via `dangerouslySetInnerHTML`.
- **Pagination**: Page buttons at bottom, 50 results per page.
- **Loading**: Skeleton cards. **Empty**: contextual message.

### 3. Update route (no change needed)

Route `/app/search` already points to `AppSearch` in `App.tsx`. No routing changes needed.

## Technical Details

### SQL function signature
```sql
CREATE OR REPLACE FUNCTION search_documents(
  search_query text,
  filter_type text DEFAULT NULL,
  filter_status text DEFAULT NULL,
  filter_date_from date DEFAULT NULL,
  filter_date_to date DEFAULT NULL,
  filter_body text DEFAULT NULL,
  exact_match boolean DEFAULT false,
  title_only boolean DEFAULT false,
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, title text, short_title text, doc_number text,
  doc_date date, status text, document_type_name text,
  document_type_slug text, issuing_body_name text,
  snippet text, rank real, total_count bigint
)
```

- When `search_query` is empty/null: skip FTS, return all docs matching filters ordered by `doc_date DESC`
- Snippet uses `ts_headline('russian', ...)` with `MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>`
- Filters applied via `WHERE` clauses with `COALESCE` for optional params

### Frontend RPC call
```typescript
const { data } = await supabase.rpc('search_documents', {
  search_query: q,
  filter_type: type || null,
  filter_status: status || null,
  exact_match: exactMatch,
  title_only: titleOnly,
  result_limit: 50,
  result_offset: (page - 1) * 50,
});
```

### Files
- **Migration**: New SQL migration with both functions
- **Rewrite**: `src/pages/AppSearch.tsx` — complete rewrite with URL params, advanced filters, pagination

