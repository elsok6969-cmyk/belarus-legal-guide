

## Plan: Rebuild Landing.tsx to exact specification

### Header (PublicHeader.tsx)
Add "Калькуляторы" (`/calculators`) between "Календарь" and "Новости" in `navLinks`. "Новости" already present.

### Landing.tsx — Full rewrite

**Remove** the following blocks entirely:
- Audience pills section
- Pricing section  
- "Полезное" 2x2 grid section
- Email capture (InlineEmailForm) section
- NPA/News tab switcher (replace with simple "Новые НПА" list)

**Keep**: PageSEO, JSON-LD, all data queries (latestDocs, rates, deadlines, indicators). Remove `latestNews` query and `npaTab` state.

#### Block 1: Hero
- White bg, no gradients. `pt-8 pb-6`, centered.
- H1: `text-2xl md:text-3xl font-bold` centered, plain text (remove `<span className="text-primary">`)
- Subtitle: exact text as specified, `text-base text-muted-foreground max-w-lg mx-auto`
- Search bar: `max-w-xl`, input height 48px, "Найти" button inside right
- Quick tags below: `border rounded-full px-3 py-1.5 text-xs hover:bg-muted cursor-pointer`

#### Block 2: Three columns
`md:grid-cols-3 grid-cols-1 gap-4`. Cards: `border rounded-xl p-4 max-h-[550px] flex flex-col`.

**Column 1 — "Новые НПА":**
- Title: `text-base font-semibold`
- 7 docs (change limit from 6 to 7)
- Each row: date (text-xs, 50px width), badge + title (line-clamp-2) + 60 chars content_text, arrow →
- `py-2 border-b border-border/30`
- Bottom link: "Все обновления →"

**Column 2 — Combined card:**
- "Курсы НБРБ" header + 5 currencies (USD/EUR/RUB/CNY/PLN) with flag, code, rate, change. `py-1.5` between rows.
- Link: "Все курсы →"
- `border-t my-3` separator
- "Показатели": ref rate 9.75%, МЗП 858 BYN, базовая величина 45 BYN, production calendar current month. Each row: `flex justify-between py-1`, name `text-xs text-muted-foreground`, value `text-sm font-semibold`
- `border-t my-3` separator  
- "Ближайшие сроки": 3 deadlines. Date `text-xs font-medium text-primary` + title `text-sm`.
- Link: "Календарь →"

**Column 3 — "Популярные разделы":**
- Title: `text-base font-semibold`
- 12 items (updated list per spec — remove Бюджетный кодекс, Охрана труда, Закупки; add Калькуляторы)
- Each: `py-2 border-b border-border/30`, name `text-sm font-medium`, desc `text-xs text-muted-foreground`, arrow →, `hover:bg-muted/50 rounded`
- No bottom link

### Technical details
- Single file edit: `src/pages/Landing.tsx` — full rewrite
- Single file edit: `src/components/layout/PublicHeader.tsx` — add "Калькуляторы" to navLinks
- No DB changes needed
- All existing imports stay except remove unused ones (Star, Check, Calendar, Banknote, Calculator, Receipt, InlineEmailForm)

