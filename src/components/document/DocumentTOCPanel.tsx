import { useMemo } from 'react';
import { ListTree } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface TocEntry {
  id: string;
  title: string | null;
  number: string | null;
  level: number;
  sort_order: number;
}

interface DocumentTOCPanelProps {
  sections: TocEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  mode: 'focus' | 'full';
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

export function DocumentTOCPanel({ sections, activeId, onSelect, mode }: DocumentTOCPanelProps) {
  const filteredSections = useMemo(
    () => sections.filter(s => {
      const label = formatTocLabel(s);
      return label.length > 0;
    }),
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
          {filteredSections.map(entry => {
            const label = formatTocLabel(entry);
            const isActive = activeId === entry.id;

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                style={{ paddingLeft: `${Math.max(entry.level, 0) * 20 + 12}px` }}
                className={cn(
                  'w-full text-left text-[13px] py-1.5 pr-3 rounded-md transition-colors block',
                  'hover:bg-accent/50',
                  isActive && 'bg-blue-50 dark:bg-blue-950/40 text-primary font-medium border-l-[3px] border-primary',
                  !isActive && 'text-muted-foreground border-l-[3px] border-transparent',
                )}
              >
                <span className="line-clamp-2">{label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
