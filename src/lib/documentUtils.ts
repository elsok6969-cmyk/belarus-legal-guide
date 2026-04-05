/** Strip navigation breadcrumbs, social links, and pravo.by junk from markdown */
export function cleanBodyText(text: string): string {
  // Remove lines that are pravo.by navigation / social sharing junk
  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip breadcrumb links
    if (/^\[(?:Главная|Правовая информация|Печатные издания|Нормативные правовые акты|Версия для печати)\]/.test(trimmed)) continue;
    // Skip social sharing links
    if (/^\[(?:ВКонтакте|Одноклассники|Facebook|Twitter|Telegram)\]/.test(trimmed)) continue;
    // Skip lines that are just "/" separators between breadcrumbs
    if (trimmed === '/' || trimmed === '/ **' || /^\/\s*$/.test(trimmed)) continue;
    // Skip lines with only pravo.by URLs
    if (/^https?:\/\/(www\.)?pravo\.by/.test(trimmed) && trimmed.length < 200) continue;
    // Skip "Версия для печати" standalone
    if (/^Версия для печати$/i.test(trimmed)) continue;
    // Skip bold breadcrumb fragments
    if (/^\/ \*\*/.test(trimmed) && trimmed.length < 100) continue;
    // Skip share URL lines (very long encoded URLs)
    if (trimmed.includes('vk.com/share') || trimmed.includes('connect.ok.ru') || trimmed.includes('facebook.com/sharer')) continue;

    cleanedLines.push(line);
  }

  let cleaned = cleanedLines.join('\n').trim();

  // Also try to find real content start markers
  const markers = ['Статья 1', 'РАЗДЕЛ I', 'ОБЩАЯ ЧАСТЬ', 'ГЛАВА 1', '## Статья', '# ОБЩАЯ ЧАСТЬ', '# Статья'];
  for (const marker of markers) {
    const idx = cleaned.indexOf(marker);
    if (idx !== -1 && idx < cleaned.length * 0.3) {
      return cleaned.slice(idx);
    }
  }

  // Remove leading # heading if it duplicates the document title (first line)
  cleaned = cleaned.replace(/^#\s+.+\n+/, '');

  return cleaned;
}
