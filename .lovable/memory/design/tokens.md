---
name: Design tokens
description: Apple-minimal design — navy+amber palette, SF Pro font, pill buttons, 16px radius cards
type: design
---
- Primary accent: Amber HSL 43 87% 55% (#F0B429)
- Text color: Navy/Gray scale (gray-900 for headings, gray-700 for body, gray-600 for secondary)
- Background: gray-50 for sections, white for cards
- Card style: 16px radius, 1px gray-200 border, NO shadow at rest, hover: translateY(-2px) + subtle shadow
- Buttons: pill (border-radius: 980px). Primary=amber, Secondary=outline navy, Ghost=transparent
- Font: -apple-system, SF Pro Display, system stack (NO Google Fonts import)
- Dark mode: class="dark" on <html>, toggled via useTheme hook in footer
- Footer: navy-900 background, 4 columns
- Header: 64px, frosted glass (blur 20px), scroll-aware border
- Badges: pill-shaped, semantic colors (codex=navy, law=blue, active=green, expired=red)
