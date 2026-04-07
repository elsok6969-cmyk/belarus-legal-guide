import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  section_id: string;
  title: string | null;
  number: string | null;
  snippet: string;
}

interface DocumentSearchBarProps {
  results: SearchResult[];
  currentIndex: number;
  isLoading: boolean;
  onSearch: (query: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onClose: () => void;
}

export function DocumentSearchBar({
  results, currentIndex, isLoading, onSearch, onNavigate, onClose,
}: DocumentSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border p-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по документу..."
          className="h-8 text-sm"
          autoFocus
        />
        {results.length > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentIndex + 1} / {results.length}
          </span>
        )}
        {isLoading && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">Поиск...</span>
        )}
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('prev')} disabled={results.length === 0}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('next')} disabled={results.length === 0}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
