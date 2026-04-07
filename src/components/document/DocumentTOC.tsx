import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string | null;
  number: string | null;
  level: number;
  sort_order: number;
  section_type: string;
  parent_id: string | null;
}

interface DocumentTOCProps {
  sections: Section[];
  activeSection: string | null;
  onScrollTo: (id: string) => void;
}

export function DocumentTOC({ sections, activeSection, onScrollTo }: DocumentTOCProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Build tree visibility: if a parent is collapsed, hide its children
  const isVisible = (section: Section): boolean => {
    if (!section.parent_id) return true;
    if (collapsed.has(section.parent_id)) return false;
    const parent = sections.find(s => s.id === section.parent_id);
    return parent ? isVisible(parent) : true;
  };

  const hasChildren = (id: string) => sections.some(s => s.parent_id === id);

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <nav className="space-y-0.5 p-3">
        {sections.map(section => {
          if (!isVisible(section)) return null;
          const label = section.number
            ? `${section.number} ${section.title || ''}`
            : section.title;
          if (!label) return null;

          const isTopLevel = section.level <= 1;
          const isCollapsible = isTopLevel && hasChildren(section.id);
          const isCollapsed = collapsed.has(section.id);

          return (
            <button
              key={section.id}
              onClick={() => {
                if (isCollapsible) toggleCollapse(section.id);
                onScrollTo(section.id);
              }}
              style={{ paddingLeft: `${section.level * 16}px` }}
              className={cn(
                'flex items-center gap-1 w-full text-left text-xs py-1.5 px-2 rounded transition-colors hover:bg-accent',
                isTopLevel ? 'font-semibold text-foreground' : 'text-muted-foreground',
                activeSection === section.id && 'bg-primary/10 text-primary'
              )}
            >
              {isCollapsible && (
                isCollapsed
                  ? <ChevronRight className="h-3 w-3 shrink-0" />
                  : <ChevronDown className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
