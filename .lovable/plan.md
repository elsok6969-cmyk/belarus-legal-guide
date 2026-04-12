

## Plan: Fix Auth Flow & Public/App Navigation

### Problem Summary
1. After login, user redirects to `/profile` instead of `/app`
2. PublicHeader shows "Войти/Регистрация" even when logged in
3. No "← На сайт" link in AppLayout sidebar
4. Google OAuth `redirect_uri` goes to `/` instead of `/app`

### Changes

#### 1. Auth.tsx — Redirect to /app after login
- Line 43: Change `<Navigate to="/profile" replace />` → `<Navigate to="/app" replace />`
- Line 75: Change `emailRedirectTo` to `window.location.origin + '/app'`
- Line 89: Change Google OAuth `redirect_uri` to `window.location.origin + '/app'`

#### 2. PublicHeader.tsx — Show user menu when logged in
- Import `useAuth`, `Avatar`, `DropdownMenu` components, `LogOut`/`User`/`Star`/`LayoutDashboard` icons
- Add `const { user, signOut } = useAuth()`
- Desktop right side: if `user` → show avatar (first letter of display_name or email) with dropdown:
  - "Личный кабинет" → `/app`
  - "Профиль" → `/app/account/profile`
  - "Избранное" → `/app/account/favorites`
  - Separator
  - "Выйти" → `signOut()`
- If `!user` → keep current "Войти" / "Регистрация" buttons
- Mobile menu: same logic — if logged in show "Личный кабинет" + "Выйти" instead of login/register

#### 3. AppLayout.tsx — Add "← На сайт" link
- In sidebar, below the theme toggle (bottom section), add a link:
  - `<Link to="/">← На сайт</Link>` styled like other sidebar items with `ExternalLink` or `ArrowLeft` icon

#### 4. No new routes needed
- `/app/documents/:id` route already exists in App.tsx (line: `<Route path="/app/documents/:id" ...>`)

### Files to modify
- `src/pages/Auth.tsx` (3 lines)
- `src/components/layout/PublicHeader.tsx` (major rewrite of right-side + mobile menu)
- `src/components/layout/AppLayout.tsx` (add "На сайт" link in sidebar bottom)

