

# Plan: Document Viewer Page `/app/documents/:id`

## Overview
Complete rewrite of `DocumentViewer.tsx` into a three-column layout with sticky TOC, in-document search via `search_within_document` RPC, related documents sidebar, view history tracking, and mobile responsiveness via a sheet-based TOC.

## Steps

### 1. Rewrite `src/pages/DocumentViewer.tsx`

**Three-column layout** (desktop: 250px left | flex center | 250px right):

**Left column — TOC (sticky, hidden on mobile)**:
- Tree from `document_sections` with indentation (`level * 16px`)
- Collapsible top-level sections (РАЗДЕЛ/ГЛАВА) using local state
- Active section tracking via Intersection Observer on each `<section>` element
- Active item highlighted with `bg-primary/10 text-primary`
- Mobile: accessible via Sheet triggered by "☰ Оглавление" button

**Center column — Document body**:
- **Header**: Type badge (colored by slug: codex=blue, law=green, etc.), status badge, `<h1>` title, metadata row (number, date, issuing body, effective date), action buttons (bookmark, subscribe/watch, copy link, share)
- **Body**: Each section wrapped in `<section id="section-{id}">`, separated by thin borders for articles. Section numbers bold, titles semibold. Typography: `text-base leading-[1.7]`, max-width 800px centered. Hover on section shows copy button.
- **In-document search**: Fixed mini-bar at top (toggled by search button or Ctrl+F override). Calls `search_within_document` RPC. Shows "Найдено в N статьях" with prev/next navigation arrows that scroll between matching sections. Results highlighted.

**Right column (hidden on mobile)**:
- "Связанные документы" — query `document_relations` joined with `documents` for this document ID
- "Изменения и редакции" — query `document_versions` for this document
- "Похожие документы" — placeholder card with "В разработке"
- Mobile: these become a collapsible section below the document body

### 2. View history tracking
- On mount, if user is authenticated, check `user_document_history` for last entry with same `document_id` and `user_id`
- If last `viewed_at` was more than 5 minutes ago (or no entry), insert new record
- Use a `useEffect` with the document ID and user ID as dependencies

### 3. Breadcrumbs
- Add breadcrumbs: Главная > {document_type.name_ru} > {doc.short_title || doc.title}
- Use the existing `Breadcrumbs` component or simple inline breadcrumb links

### 4. Performance for large documents
- Use Intersection Observer to lazily render section content — initially render only sections near viewport
- Sections outside viewport render as placeholder divs with estimated height
- Cache document data via react-query `staleTime: 3600000` (1 hour)

## Technical Details

- **Intersection Observer for TOC**: One observer watches all `<section>` elements. The topmost visible section sets `activeSection` state, which highlights the TOC item.
- **Collapsible TOC sections**: State `collapsedSections: Set<string>`. Clicking a level-0 item toggles its children's visibility.
- **Copy article text**: On hover, show a small clipboard button. On click, copy `section.content_text || section.content_markdown` to clipboard via `navigator.clipboard.writeText`.
- **In-document search RPC call**:
```typescript
const { data } = await supabase.rpc('search_within_document', {
  p_document_id: id,
  search_query: query,
});
```
Results return `section_id` — scroll to matching section and highlight snippet.
- **Related documents query**: `document_relations` where `source_document_id = id OR target_document_id = id`, joined with `documents` for title/short_title.
- **Mobile layout**: Use `useIsMobile()` hook. On mobile, hide left/right columns. TOC opens in a `Sheet` from left. Right column content moves below the document body.

### Files
- **Rewrite**: `src/pages/DocumentViewer.tsx` — complete rewrite with three-column layout

