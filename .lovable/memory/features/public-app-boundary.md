---
name: Public/App boundary
description: ilex-style public portal with freemium gate — what's public vs behind auth
type: feature
---

## Structure (ilex-style)
- Landing = content portal (NOT marketing page)
- All content publicly visible: news, articles, currency rates, calendar, document list, topics
- Full document text (body_text) = behind free registration (freemium gate with Lock icon)
- AI assistant, bookmarks, subscriptions, settings = behind auth (/app/*)

## Public routes (no auth)
- / — ilex-style portal: latest docs, articles, rates sidebar, calendar sidebar
- /rates — full currency rates page (NBRB)
- /calendar — deadline calendar
- /documents — document list with search/filter
- /documents/:id — document view (summary public, body_text behind registration)
- /news, /topics, /experts — all public

## Auth routes (/app/*)
- /app — authenticated dashboard
- /app/search, /app/assistant, /app/bookmarks, /app/settings
- Auth temporarily disabled for review (AuthGuard removed from routes)

## RLS
- currency_rates, deadline_calendar, documents, topics, articles — public SELECT
- document_sections — authenticated SELECT (premium content)
- bookmarks, subscriptions, user_settings — user's own data only
