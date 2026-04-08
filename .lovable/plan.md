

# Plan: Smart Freemium System — SEO + Monetization

## Summary
Build a content gating system with progressive paywall, individual article SEO pages, analytics tracking, and email collection — all while maximizing Google indexing.

---

## Database Changes (1 migration)

**New tables:**
- `content_views` — page view tracking (user_id nullable, session_id, page_url, created_at)
- `paywall_events` — funnel analytics (event_type: impression/click_register/click_subscribe/click_login, session_id, page_url)
- `email_subscribers` — email collection (email, source, subscribed_at, is_active)

**Update `subscription_limits`** — insert rows for the new access matrix (search: 15/day free, ai_chat: 5/day free, favorites: 5 free, etc.)

RLS: `content_views` and `paywall_events` — public INSERT, admin SELECT. `email_subscribers` — public INSERT, admin SELECT.

---

## Components to Create

### 1. `ContentGate` component (`src/components/paywall/ContentGate.tsx`)
Core gating logic per section index:

- **Not logged in**: show first 5 sections, blur section 6, hide rest. Progressive decay via localStorage (`babijon_visit_count`, `babijon_articles_read`): visits 4-7 → 3 sections, visits 8+ → 1 section.
- **Free plan**: FREE_CODEXES (`ГК РБ` id, `ТК РБ` id, `НК РБ (Общая)` id) → full access. Other codexes → 10 sections then paywall.
- **Paid plan**: no restrictions.

Paywall blocks: two variants — registration CTA (for anonymous) and subscription CTA (for free users). Styled inline, no popups. Records `paywall_events` on impression/click.

CSS blur effect: `max-height: 120px; overflow: hidden` + gradient overlay `linear-gradient(transparent, white)` on the boundary section.

### 2. `ExitIntentPopup` component (`src/components/paywall/ExitIntentPopup.tsx`)
Desktop: mouse leaves viewport top. Mobile: 60s timeout. Shows email collection form once per session (localStorage flag). Saves to `email_subscribers` with source='exit_popup'.

### 3. `InlineEmailForm` component (`src/components/paywall/InlineEmailForm.tsx`)
Reusable email capture form for articles and calculators. Source parameter for tracking.

---

## Page Changes

### 4. Integrate `ContentGate` into `PublicDocumentView.tsx`
Wrap each section render with `ContentGate`. Pass `sectionIndex`, document ID, total sections. TOC remains fully visible (SEO). Section titles beyond limit shown greyed out.

### 5. Individual Article Pages — new route `/codex/:codexSlug/statya-:number`
New page `src/pages/CodexArticle.tsx`:
- Fetches single `document_section` by document short_title mapping + section number
- Full text of ONE article (always free for everyone)
- SEO title: "Статья {N} {CodexName} — {ArticleTitle} | Бабиджон"
- Links to prev/next articles
- "Читать весь кодекс →" link to `/documents/:id`
- "Задать вопрос AI по этой статье" button
- JSON-LD structured data per article

This creates ~5000+ indexable pages from existing data.

### 6. Paywalled content JSON-LD
Add `isAccessibleForFree` schema markup to `PublicDocumentView` when paywall is active. Free sections get `.free-content` CSS class.

### 7. Landing page email forms
- Add `InlineEmailForm` after article cards on landing
- Add `ExitIntentPopup` to `PublicLayout`

### 8. Calculator email capture
After calculation result in VatCalc and IncomeTaxCalc, show inline email form: "Получите результат на email"

---

## Admin Analytics Page

### 9. `/admin/analytics` page
New page showing:
- Funnel: views → paywall impressions → clicks → registrations
- Top pages by views
- Paywall conversion rates per document
- Email subscriber count by source

Data from `content_views`, `paywall_events`, `email_subscribers`.

---

## Routing Updates (App.tsx)
- Add `/codex/:codexSlug/statya-:number` → `CodexArticle` (public)
- Add `/admin/analytics` → `AdminAnalytics` (admin guarded)

---

## Files to create/modify

| Action | File |
|--------|------|
| Create | `src/components/paywall/ContentGate.tsx` |
| Create | `src/components/paywall/ExitIntentPopup.tsx` |
| Create | `src/components/paywall/InlineEmailForm.tsx` |
| Create | `src/pages/CodexArticle.tsx` |
| Create | `src/pages/AdminAnalytics.tsx` |
| Create | `src/hooks/useVisitTracking.ts` |
| Modify | `src/pages/PublicDocumentView.tsx` — integrate ContentGate |
| Modify | `src/pages/Landing.tsx` — add inline email form |
| Modify | `src/components/layout/PublicLayout.tsx` — add ExitIntentPopup |
| Modify | `src/App.tsx` — add new routes |
| Modify | `src/pages/calculators/VatCalc.tsx` — email capture after result |
| Modify | `src/pages/calculators/IncomeTaxCalc.tsx` — email capture after result |
| Migration | New tables + subscription_limits data |

