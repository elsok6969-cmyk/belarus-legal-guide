

## Plan: Add blocks 3-6 below three columns on Landing.tsx

### What changes

Replace everything after the three-column `</section>` (lines 455-543) — removing Audience Pills, Pricing, Полезное, and Email Capture — with four new blocks:

### Block 3: Инструменты (lines ~455+)
- `bg-muted/30 py-10` section
- Title: "Инструменты" centered, `text-xl font-semibold mb-6`
- 4-column grid (`md:grid-cols-4 grid-cols-2 gap-3`)
- Cards: `bg-background border rounded-lg p-4 hover:shadow-sm hover:border-foreground/20 transition-all text-center`
- Items: Калькулятор НДС → `/calculator/nds`, Подоходный налог → `/calculator/income-tax`, Курсы валют → `/currencies`, Произв. календарь → `/production-calendar`

### Block 4: Профессии
- White bg, `py-8`, no heading
- `flex flex-wrap justify-center gap-2`
- Reuse existing `audienceTags` array, style: `border rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors`
- Links go to `/documents?profession=<slug>`

### Block 5: Новости
- White bg, `py-10`
- Title: "Новости законодательства" `text-xl font-semibold mb-6`
- Reuse existing `latestNews` query (change limit to 3, add `body` to select)
- `md:grid-cols-3 grid-cols-1 gap-4` grid
- Each card: `border rounded-xl p-4 hover:shadow-sm transition-all`, clickable → `/news/:slug`
- Date, title (line-clamp-2), 80-char excerpt, topic badge
- "Все новости →" link centered below
- **Conditionally render**: only if `latestNews && latestNews.length > 0`

### Block 6: CTA
- `bg-muted/30 py-10 text-center`
- Title: "Полный доступ к законодательству"
- Subtitle: "Все кодексы, законы и указы с навигацией по статьям"
- Two buttons: [Оформить подписку] primary → `/pricing`, [Попробовать] outline → `/auth`

### Technical details
- Single file edit: `src/pages/Landing.tsx`
- Remove unused imports: `Star`, `Check`, `Calendar`, `Banknote`, `Calculator`, `Receipt`, `InlineEmailForm`
- Remove `pricingPlans` constant
- Update `latestNews` query: limit 3, add `body` field
- No DB changes needed

