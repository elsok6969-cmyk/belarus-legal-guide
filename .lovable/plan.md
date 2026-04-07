

# Plan: Admin Import Dashboard (`/admin/import`)

## Overview
Create an admin-only page at `/admin/import` with 4 sections: database status, codex import, single document import, and data cleanup tools.

## Steps

### 1. Create `AdminGuard` component
New file `src/components/auth/AdminGuard.tsx`. Wraps children, checks auth + admin role via `user_roles` table (using `has_role` pattern). Shows spinner while loading, redirects to `/` if not admin.

### 2. Create `AdminImport` page
New file `src/pages/AdminImport.tsx` with 4 sections:

**Section 1 — Database Status**: Query `document_types` joined with `documents`, compute counts (total, with content >500 chars, broken). Display in a table with conditional row colors (yellow if broken > 0, red if no content at all).

**Section 2 — Import Codexes**: Button calls `import-codexes` edge function via fetch (SSE stream). Progress bar + readonly textarea log with auto-scroll. Supports batch parameter. Parses SSE `data:` lines for progress updates.

**Section 3 — Single Document Import**: URL input + document type dropdown (fetched from `document_types`). "Parse" button calls `parse-pravo-document` edge function. Shows preview (title, char count, first 500 chars). "Save to DB" button inserts into `documents` + `document_sections`.

**Section 4 — Data Cleanup**: Three buttons with confirmation dialogs:
- Delete broken records (content_text < 500 chars) — calls delete via supabase client
- Delete duplicates (same title + type, keep largest) — custom logic
- Reindex — calls a small edge function or raw SQL

Each dangerous action shows an `AlertDialog` with count of affected records before proceeding.

### 3. Add route to `App.tsx`
Add `/admin/import` route wrapped in `AdminGuard` + `AppLayout`.

### Technical Details

- **Role check**: Query `user_roles` table where `user_id = auth.uid()` and `role = 'admin'`. This uses the existing `user_roles` table and `has_role` function.
- **SSE parsing**: Use `fetch` + `ReadableStream` reader to parse `text/event-stream` from `import-codexes`.
- **Cleanup operations**: Since the client has RLS restricting deletes to admin role, the delete/update operations need to go through edge functions (service_role). Will create a small `admin-cleanup` edge function for delete/reindex operations.
- **Edge function for cleanup**: New `supabase/functions/admin-cleanup/index.ts` that accepts action type (`delete_broken`, `delete_duplicates`, `reindex`) and performs the operation with service_role privileges. Validates admin role from JWT before executing.

### Files to create/modify
- **Create**: `src/components/auth/AdminGuard.tsx`
- **Create**: `src/pages/AdminImport.tsx`
- **Create**: `supabase/functions/admin-cleanup/index.ts`
- **Modify**: `src/App.tsx` — add admin route

