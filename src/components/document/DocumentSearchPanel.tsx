import { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchMatch {
  sectionId: string;
  title: string;
}

interface DocumentSearchPanelProps {
  matches: SearchMatch[];
  currentIndex: number;
  onSearch: (query: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onClose: () => void;
}

export function DocumentSearchPanel({
  matches, currentIndex, onSearch, onNavigate, onClose,
}: DocumentSearchPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) onSearch(query.trim());
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm p-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) onSearch(e.target.value.trim());
          }}
          placeholder="Поиск по документу..."
          className="h-8 text-sm"
        />
        {matches.length > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Найдено в {matches.length} стать{matches.length === 1 ? 'е' : matches.length < 5 ? 'ях' : 'ях'}
            {' '}({currentIndex + 1}/{matches.length})
          </span>
        )}
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onNavigate('prev')} disabled={matches.length === 0}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onNavigate('next')} disabled={matches.length === 0}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
