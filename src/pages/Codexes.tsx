import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, string> = {
  'гражданский': '⚖️', 'налоговый': '💰', 'трудовой': '👷', 'уголовный': '🔒',
  'жилищный': '🏠', 'банковский': '🏦', 'семейный': '👨‍👩‍👧‍👦', 'земельный': '🌍',
  'водный': '💧', 'воздушный': '✈️', 'лесной': '🌲', 'избирательный': '🗳️',
  'таможенный': '📦', 'бюджетный': '📊', 'процессуально-исполнительный': '📋',
  'хозяйственный процессуальный': '🏛️', 'уголовно-процессуальный': '⚙️',
  'уголовно-исполнительный': '🔐', 'гражданский процессуальный': '📜',
  'торговое мореплавание': '🚢', 'недра': '⛏️', 'образовани': '🎓',
  'здравоохранени': '🏥', 'культур': '🎭', 'спорт': '🏅', 'администрат': '📑',
};

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return '📘';
}

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
    <div className="container-apple py-12">
      <div className="mb-10">
        <h1>Кодексы Республики Беларусь</h1>
        <p className="mt-2" style={{ fontSize: 17, color: 'hsl(var(--gray-600))' }}>
          {codexes ? `${codexes.length} кодексов в актуальных редакциях` : 'Загрузка...'}
        </p>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--gray-400))' }} />
        <input
          placeholder="Найти кодекс..."
          className="w-full bg-transparent outline-none"
          style={{
            border: '2px solid hsl(var(--gray-200))',
            borderRadius: 12,
            padding: '12px 16px 12px 44px',
            fontSize: 15,
            color: 'hsl(var(--gray-900))',
            transition: 'border-color 0.2s',
          }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc: any) => (
            <Link
              key={doc.id}
              to={`/app/documents/${doc.id}`}
              className="card-apple flex items-center gap-4 group"
              style={{ padding: '20px 24px' }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: 'hsl(var(--navy-50))',
                  borderRadius: 12,
                  fontSize: 24,
                }}
              >
                {getIcon(doc.title)}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-medium leading-tight line-clamp-2 transition-colors"
                  style={{ fontSize: 16, color: 'hsl(var(--navy-900))' }}
                >
                  {doc.title}
                </p>
                {doc.doc_date && (
                  <p style={{ fontSize: 13, color: 'hsl(var(--gray-400))', marginTop: 2 }}>
                    {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 transition-all group-hover:translate-x-1"
                style={{ color: 'hsl(var(--gray-400))' }}
              />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center py-12" style={{ fontSize: 15, color: 'hsl(var(--gray-600))' }}>
          По вашему запросу ничего не найдено
        </p>
      )}
    </div>
  );
}
