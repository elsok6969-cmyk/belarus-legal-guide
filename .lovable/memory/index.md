# Project Memory

## Core
Belarus Law Portal "ПравоБУ" — legal document search + AI assistant (ilex.by alternative).
All UI in Russian. Lovable Cloud backend. Inter font.
Primary teal-600 #0d9488 (HSL 174 84% 32%), rounded-xl, dark mode supported.
NOT legal advice — AI must ALWAYS show disclaimer + source citations.
No extra modules (CRM, billing, admin) unless explicitly requested.
Landing content is STATIC only — never AI-generated. AI assistant only behind login.
Not affiliated with government — always state independence clearly.

## Memories
- [Design tokens](mem://design/tokens) — Teal-600 primary, rounded-xl, dark mode, Inter font
- [SEO & accessibility](mem://design/seo-accessibility) — Meta tags, headings, ARIA, JSON-LD, trust rules
- [Auth flow](mem://features/auth) — Email+password, profiles table, auto-create on signup
- [Audit logging](mem://features/audit-logs) — audit_logs table structure and RLS
- [Public/App boundary](mem://features/public-app-boundary) — What content goes on landing vs app, redirect rules
