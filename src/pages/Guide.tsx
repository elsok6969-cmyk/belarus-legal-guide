import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  parent_id: string | null;
  slug: string;
  name_ru: string;
  profession: string | null;
  icon: string | null;
  sort_order: number;
  description: string | null;
}

interface GuideItem {
  id: string;
  category_id: string;
  document_id: string | null;
  title_override: string | null;
  description: string | null;
  sort_order: number;
}

const professionTabs = [
  { key: null, label: 'Все', icon: '' },
  { key: 'accountant', label: 'Бухгалтеру', icon: '📊' },
  { key: 'lawyer', label: 'Юристу', icon: '⚖️' },
  { key: 'hr_specialist', label: 'Кадровику', icon: '👷' },
  { key: 'procurement_specialist', label: 'По закупкам', icon: '🛒' },
  { key: 'labor_safety', label: 'Охрана труда', icon: '🦺' },
  { key: 'economist', label: 'Экономисту', icon: '💹' },
  { key: 'individual', label: 'Физлицу', icon: '👤' },
  { key: 'builder', label: 'Строителю', icon: '🏗' },
  { key: 'ecologist', label: 'Экологу', icon: '🌿' },
];

export default function Guide() {
  const [profession, setProfession] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['guide-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('guide_categories')
        .select('*')
        .order('sort_order');
      return (data || []) as Category[];
    },
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['guide-items', selectedCategoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from('guide_items')
        .select('*')
        .eq('category_id', selectedCategoryId!)
        .order('sort_order');
      return (data || []) as GuideItem[];
    },
    enabled: !!selectedCategoryId,
  });

  const filteredCategories = (categories || []).filter(
    (c) => !profession || !c.profession || c.profession === profession,
  );

  const topLevel = filteredCategories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    filteredCategories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectCategory = (cat: Category) => {
    setSelectedCategoryId(cat.id);
    if (!expandedIds.has(cat.id)) toggleExpand(cat.id);
  };

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  return (
    <>
      <PageSEO title="Проводник — Бабиджон" description="Навигатор по документам для профессионалов" path="/app/guide" />
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Проводник по документам</h1>

        {/* Profession tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {professionTabs.map((tab) => (
            <button
              key={tab.key ?? 'all'}
              onClick={() => {
                setProfession(tab.key);
                setSelectedCategoryId(null);
              }}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
                profession === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {tab.icon ? `${tab.icon} ${tab.label}` : tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Tree sidebar */}
          <div className="space-y-1 lg:border-r lg:pr-4">
            {catLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
            ) : (
              topLevel.map((cat) => {
                const children = getChildren(cat.id);
                const isExpanded = expandedIds.has(cat.id);
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => selectCategory(cat)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground',
                      )}
                    >
                      <span className="shrink-0">{cat.icon || '📁'}</span>
                      <span className="flex-1 truncate">{cat.name_ru}</span>
                      {children.length > 0 && (
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform text-muted-foreground',
                            isExpanded && 'rotate-90',
                          )}
                        />
                      )}
                    </button>
                    {isExpanded && children.length > 0 && (
                      <div className="ml-6 space-y-0.5 mt-0.5">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedCategoryId(child.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition-colors',
                              selectedCategoryId === child.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-muted-foreground',
                            )}
                          >
                            <span className="shrink-0">{child.icon || '📄'}</span>
                            <span className="truncate">{child.name_ru}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Content */}
          <div>
            {!selectedCategoryId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Выберите категорию слева для просмотра документов</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCategory && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <span>{selectedCategory.icon}</span> {selectedCategory.name_ru}
                    </h2>
                    {selectedCategory.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedCategory.description}</p>
                    )}
                  </div>
                )}

                {itemsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : items && items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {item.document_id ? (
                            <Link
                              to={`/app/documents/${item.document_id}`}
                              className="flex items-start gap-3 group"
                            >
                              <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {item.title_override || 'Документ'}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="shrink-0 ml-auto">НПА</Badge>
                            </Link>
                          ) : (
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">
                                  {item.title_override || 'Документ'}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    В этой категории пока нет документов
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
