import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const isVisible = (section: Section): boolean => {
    if (!section.parent_id) return true;
    if (collapsed.has(section.parent_id)) return false;
    const parent = sections.find(s => s.id === section.parent_id);
    return parent ? isVisible(parent) : true;
  };

  const hasChildren = (id: string) => sections.some(s => s.parent_id === id);

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <nav className="p-4" style={{ background: 'hsl(var(--gray-50))' }}>
        <div className="space-y-0.5">
          {sections.map(section => {
            if (!isVisible(section)) return null;
            const label = section.number
              ? `${section.number} ${section.title || ''}`
              : section.title;
            if (!label) return null;

            const isTopLevel = section.level <= 1;
            const isCollapsible = isTopLevel && hasChildren(section.id);
            const isCollapsed = collapsed.has(section.id);
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => {
                  if (isCollapsible) toggleCollapse(section.id);
                  onScrollTo(section.id);
                }}
                style={{
                  paddingLeft: `${Math.max(section.level * 12, 12)}px`,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: isActive ? '0 8px 8px 0' : 8,
                  fontSize: 14,
                  color: isActive ? 'hsl(var(--navy-900))' : 'hsl(var(--gray-600))',
                  fontWeight: isActive ? 500 : isTopLevel ? 600 : 400,
                  background: isActive ? 'hsl(var(--card))' : 'transparent',
                  borderLeft: isActive ? '3px solid hsl(var(--amber-500))' : '3px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'hsl(var(--card))';
                    e.currentTarget.style.color = 'hsl(var(--gray-900))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'hsl(var(--gray-600))';
                  }
                }}
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
        </div>
      </nav>
    </ScrollArea>
  );
}
