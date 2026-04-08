# Project Memory

## Core
Belarus Law Portal — legal document search + AI assistant. Name/domain TBD.
All UI in Russian. Lovable Cloud backend. Inter font.
Primary blue #2563EB (HSL 215 80% 42%), dark sidebar. 
NOT legal advice — AI must ALWAYS show disclaimer + source citations.
No extra modules (CRM, billing, admin) unless explicitly requested.
Landing content is STATIC only — never AI-generated. AI assistant only behind login.
Not affiliated with government — always state independence clearly.
Only change what's asked, on the specified page — never touch unrelated files.

## Memories
- [Design tokens](mem://design/tokens) — Color palette, warning tokens, sidebar dark theme
- [SEO & accessibility](mem://design/seo-accessibility) — Meta tags, headings, ARIA, JSON-LD, trust rules
- [Auth flow](mem://features/auth) — Email+password, profiles table, auto-create on signup
- [Audit logging](mem://features/audit-logs) — audit_logs table structure and RLS
- [Public/App boundary](mem://features/public-app-boundary) — What content goes on landing vs app, redirect rules
- [Scope discipline](mem://preferences/scope) — Only change exactly what user asks, on the specific page
