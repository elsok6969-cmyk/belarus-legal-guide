import { useMemo } from 'react';
import { ListTree, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface TocEntry {
  id: string;
  title: string | null;
  number: string | null;
  level: number;
  sort_order: number;
  section_type?: string;
}

interface DocumentTOCPanelProps {
  sections: TocEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  mode: 'focus' | 'full';
  /** Number of free articles visible (sections with index >= this are locked) */
  freeLimit?: number;
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function formatTocLabel(entry: TocEntry): string {
  if (entry.number && entry.title) {
    return truncate(`${entry.number} ${entry.title}`, 45);
  }
  if (entry.number) return truncate(entry.number, 45);
  if (entry.title) return truncate(entry.title, 45);
  return '';
}

export function DocumentTOCPanel({ sections, activeId, onSelect, mode, freeLimit = Infinity }: DocumentTOCPanelProps) {
  const filteredSections = useMemo(
    () => sections.filter(s => formatTocLabel(s).length > 0),
    [sections]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ListTree className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Содержание</span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="py-2 px-2">
          {filteredSections.map((entry, idx) => {
            const label = formatTocLabel(entry);
            const isActive = activeId === entry.id;
            const isStructural = entry.section_type === 'part' || entry.section_type === 'chapter' || entry.section_type === 'section';
            // Count only non-structural sections for lock
            const articleIdx = isStructural ? -1 : filteredSections.filter((e, i) => i <= filteredSections.indexOf(entry) && e.section_type !== 'part' && e.section_type !== 'chapter' && e.section_type !== 'section').length - 1;
            const isLocked = !isStructural && articleIdx >= freeLimit;

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                style={{ paddingLeft: `${Math.max(entry.level, 0) * 20 + 12}px` }}
                className={cn(
                  'w-full text-left text-[13px] py-1.5 pr-3 rounded-md transition-colors block cursor-pointer',
                  'hover:bg-accent/50',
                  isActive && !isLocked && 'bg-blue-50 dark:bg-blue-950/40 text-primary font-medium border-l-[3px] border-primary',
                  isActive && isLocked && 'bg-blue-50 dark:bg-blue-950/40 text-muted-foreground font-medium border-l-[3px] border-primary',
                  !isActive && !isLocked && 'text-muted-foreground border-l-[3px] border-transparent',
                  !isActive && isLocked && 'text-muted-foreground/70 border-l-[3px] border-transparent',
                )}
              >
                <span className="line-clamp-2 flex items-center gap-1.5">
                  {label}
                  {isLocked && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                </span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
