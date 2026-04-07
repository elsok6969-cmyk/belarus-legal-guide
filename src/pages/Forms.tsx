import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, FileEdit, FileSpreadsheet, FileText, File } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';

const categories = [
  { key: 'all', label: 'Все' },
  { key: 'tax_reporting', label: 'Налоговая отчётность' },
  { key: 'accounting', label: 'Бухучёт' },
  { key: 'hr', label: 'Кадры' },
  { key: 'procurement', label: 'Закупки' },
  { key: 'corporate', label: 'Корпоративные' },
  { key: 'contracts', label: 'Сделки' },
  { key: 'powers_of_attorney', label: 'Доверенности' },
  { key: 'ecology', label: 'Экология' },
] as const;

const fileIcons: Record<string, { icon: typeof FileText; label: string }> = {
  xlsx: { icon: FileSpreadsheet, label: 'XLSX' },
  docx: { icon: FileText, label: 'DOCX' },
  pdf: { icon: File, label: 'PDF' },
};

export default function Forms() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: forms, isLoading } = useQuery({
    queryKey: ['form-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_documents')
        .select('*')
        .order('category')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!forms) return [];
    return forms.filter((f) => {
      if (activeCategory !== 'all' && f.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.tags?.some((t: string) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [forms, activeCategory, search]);

  const grouped = useMemo(() => {
    if (activeCategory !== 'all') return { [activeCategory]: filtered };
    const map: Record<string, typeof filtered> = {};
    for (const f of filtered) {
      (map[f.category] ??= []).push(f);
    }
    return map;
  }, [filtered, activeCategory]);

  const categoryLabel = (key: string) =>
    categories.find((c) => c.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <PageSEO title="Формы и образцы документов" description="Каталог форм, бланков и образцов документов для бизнеса в Беларуси" />

      <div>
        <h1 className="text-2xl font-bold">Формы и образцы документов</h1>
        <p className="text-muted-foreground mt-1">Скачивайте бланки и заполняйте формы онлайн</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.key}
            variant={activeCategory === c.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию формы..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          {activeCategory === 'all' && (
            <h2 className="text-lg font-semibold">{categoryLabel(cat)}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((form) => {
              const fi = fileIcons[form.file_type || 'pdf'] ?? fileIcons.pdf;
              const Icon = fi.icon;
              return (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm leading-snug line-clamp-2">{form.title}</h3>
                        {form.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{fi.label}</Badge>
                      {form.is_fillable && (
                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Заполняемая</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={!form.file_url}
                        onClick={() => form.file_url && window.open(form.file_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {form.file_url ? 'Скачать' : 'Скоро'}
                      </Button>
                      {form.is_fillable && (
                        <Button size="sm" className="flex-1 text-xs" disabled>
                          <FileEdit className="h-3 w-3 mr-1" />
                          Заполнить
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Формы не найдены. Попробуйте изменить фильтры.
        </div>
      )}
    </div>
  );
}
