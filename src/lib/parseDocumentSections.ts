/**
 * Client-side parser: splits raw codex markdown into virtual sections
 * when document_sections table is empty.
 */

export interface VirtualSection {
  id: string;
  title: string;
  level: number;
  content: string;
  sort_order: number;
}

// Header patterns in Belarusian & Russian legal texts
const HEADER_PATTERNS = [
  // Part / Часть / Частка
  { regex: /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ|АГУЛЬНАЯ ЧАСТКА|АСАБЛІВАЯ ЧАСТКА)$/m, level: 0 },
  { regex: /^(ЧАСТЬ|ЧАСТКА)\s+.+$/m, level: 0 },
  // Section / Раздел / Раздзел
  { regex: /^(РАЗДЕЛ|РАЗДЗЕЛ)\s+[IVXLCDM\d]+\.?\s*.*/m, level: 1 },
  // Chapter / Глава
  { regex: /^(ГЛАВА|ГЛАВА)\s+\d+[\d.]*\.?\s*.*/m, level: 2 },
  // Article / Статья / Артыкул
  { regex: /^(Статья|Артыкул)\s+\d+[\d.]*\.?\s*.*/m, level: 3 },
];

const COMBINED_HEADER = /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ|АГУЛЬНАЯ ЧАСТКА|АСАБЛІВАЯ ЧАСТКА|(?:ЧАСТЬ|ЧАСТКА)\s+.+|(?:РАЗДЕЛ|РАЗДЗЕЛ)\s+[IVXLCDM\d]+\.?\s*.*|(?:ГЛАВА)\s+\d+[\d.]*\.?\s*.*|(?:Статья|Артыкул)\s+\d+[\d.]*\.?\s*.*)$/m;

function getLevel(line: string): number {
  for (const p of HEADER_PATTERNS) {
    if (p.regex.test(line)) return p.level;
  }
  return -1;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\wа-яё\d]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export function parseMarkdownIntoSections(markdown: string): VirtualSection[] {
  if (!markdown || markdown.length < 100) return [];

  const lines = markdown.split('\n');
  const sections: VirtualSection[] = [];
  let currentTitle = '';
  let currentLevel = -1;
  let currentLines: string[] = [];
  let order = 0;

  // Accumulate a preamble before first header
  let preambleLines: string[] = [];
  let foundFirstHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const level = getLevel(trimmed);

    if (level >= 0) {
      // Save previous section
      if (foundFirstHeader && currentTitle) {
        sections.push({
          id: `vs-${order}`,
          title: currentTitle,
          level: currentLevel,
          content: currentLines.join('\n').trim(),
          sort_order: order,
        });
        order++;
      }

      if (!foundFirstHeader && preambleLines.length > 0) {
        // Save preamble
        sections.push({
          id: 'vs-preamble',
          title: 'Преамбула',
          level: 0,
          content: preambleLines.join('\n').trim(),
          sort_order: order,
        });
        order++;
        foundFirstHeader = true;
      }
      foundFirstHeader = true;

      currentTitle = trimmed;
      currentLevel = level;
      currentLines = [];
    } else {
      if (foundFirstHeader) {
        currentLines.push(line);
      } else {
        preambleLines.push(line);
      }
    }
  }

  // Push last section
  if (currentTitle) {
    sections.push({
      id: `vs-${order}`,
      title: currentTitle,
      level: currentLevel,
      content: currentLines.join('\n').trim(),
      sort_order: order,
    });
  }

  return sections;
}

/** For TOC: only show parts, sections, chapters (levels 0-2) */
export function getTocSections(sections: VirtualSection[]): VirtualSection[] {
  return sections.filter(s => s.level <= 2);
}
