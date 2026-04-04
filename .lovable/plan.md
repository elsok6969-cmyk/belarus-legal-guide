
<lov-plan-name>Belarus Law Platform — Project Skeleton</lov-plan-name>

## Overview
Set up the foundational skeleton for "Belarus Law Platform" — a legal document search platform with AI assistant. All UI in Russian. Lovable Cloud backend with auth, profiles, and audit logging.

## Pages & Routing
- **`/auth`** — Login/Register page (tabs: Вход / Регистрация), email+password auth
- **`/`** — Home page with search bar and recent documents placeholder
- **`/documents/:id`** — Document Viewer placeholder (stub content)
- **`/ai-chat`** — AI Chat placeholder with disclaimer banner: "Платформа не предоставляет юридических консультаций"
- **`*`** — 404 page in Russian

## Core Layout
- **Top bar**: Search input (non-functional stub), user avatar/menu with logout
- **Left sidebar**: Navigation links — Главная, Документы, AI Ассистент; collapsible via SidebarTrigger
- **Main content area**: Renders routed page content

## Auth Flow
- Email + password signup/login using Lovable Cloud (Supabase)
- Protected routes redirect unauthenticated users to `/auth`
- Auth context provider wrapping the app

## Database (Lovable Cloud)
- **profiles** table: `id (uuid, FK auth.users)`, `display_name`, `avatar_url`, `created_at`, `updated_at` — with RLS (users read/update own profile), trigger on signup
- **audit_logs** table: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata (jsonb)`, `created_at` — insert-only RLS for authenticated users, select own logs

## Project Structure
```
src/
  components/
    layout/AppLayout.tsx      — sidebar + topbar + main area
    layout/AppSidebar.tsx      — left nav
    layout/TopBar.tsx          — search + user menu
    auth/AuthGuard.tsx         — route protection
  pages/
    Auth.tsx, Index.tsx, DocumentViewer.tsx, AIChat.tsx, NotFound.tsx
  hooks/
    useAuth.ts                 — auth state hook
  lib/
    supabase.ts               — Supabase client
```

## TODOs (not implemented in this step)
- Actual search functionality
- Document data model & viewer logic
- AI chat backend integration
- Server-side logging (edge function)
- Password reset flow
