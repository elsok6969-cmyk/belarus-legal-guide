import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingTimeout } from '@/components/shared/LoadingTimeout';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, string> = {
  'гражданский': '⚖️',
  'налоговый': '💰',
  'трудовой': '👷',
  'уголовный': '🔒',
  'жилищный': '🏠',
  'банковский': '🏦',
  'семейный': '👨‍👩‍👧‍👦',
  'земельный': '🌍',
  'водный': '💧',
  'воздушный': '✈️',
  'лесной': '🌲',
  'избирательный': '🗳️',
  'таможенный': '📦',
  'бюджетный': '📊',
  'процессуально-исполнительный': '📋',
  'хозяйственный процессуальный': '🏛️',
  'уголовно-процессуальный': '⚙️',
  'уголовно-исполнительный': '🔐',
  'гражданский процессуальный': '📜',
  'торговое мореплавание': '🚢',
  'недра': '⛏️',
  'образовани': '🎓',
  'здравоохранени': '🏥',
  'культур': '🎭',
  'спорт': '🏅',
  'администрат': '📑',
};

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return '📘';
}

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: 'Действующий', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  not_effective_yet: { label: 'Не вступил в силу', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expired: { label: 'Утратил силу', className: 'bg-muted text-muted-foreground' },
};

export default function Codexes() {
  const [filter, setFilter] = useState('');

  const { data: codexes, isLoading } = useQuery({
    queryKey: ['codexes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, short_title, doc_date, status, document_types(name_ru, slug)')
        .eq('document_types.slug', 'codex')
        .not('document_types', 'is', null)
        .order('title');
      return (data || []).filter((d: any) => d.document_types?.slug === 'codex');
    },
    staleTime: 3600000,
  });

  const filtered = useMemo(() => {
    if (!codexes) return [];
    if (!filter.trim()) return codexes;
    const q = filter.toLowerCase();
    return codexes.filter((c: any) =>
      c.title.toLowerCase().includes(q) || c.short_title?.toLowerCase().includes(q)
    );
  }, [codexes, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Кодексы Республики Беларусь</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {codexes ? `${codexes.length} кодексов в актуальных редакциях` : 'Загрузка...'}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          className="pl-9"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <LoadingTimeout isLoading={isLoading} skeletonCount={9} skeletonClassName="h-36 w-full">
        {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc: any) => {
            const st = statusLabels[doc.status] || statusLabels.active;
            return (
              <Link
                key={doc.id}
                to={`/app/documents/${doc.id}`}
                className="group block rounded-xl border bg-card p-5 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{getIcon(doc.title)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {doc.title}
                    </p>
                    {doc.short_title && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.short_title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  {doc.doc_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  <Badge variant="secondary" className={`text-[10px] ${st.className}`}>
                    {st.label}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">
          По вашему запросу ничего не найдено
        </p>
      )}
    </div>
  );
}
