import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, BookOpen, Compass, Calculator, FolderOpen, List,
  CalendarDays, Info, Bot, Star, Clock, ChevronRight, ArrowRight,
  Newspaper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const quickNav = [
  { icon: BookOpen, label: 'Кодексы', to: '/app/search?type=codex' },
  { icon: FileText, label: 'Новые документы', to: '/app/search' },
  { icon: Compass, label: 'Проводник', to: '/app/topics' },
  { icon: Calculator, label: 'Калькуляторы', to: '/app/services/rates' },
  { icon: FolderOpen, label: 'Формы', to: '/app/search?type=form' },
  { icon: List, label: 'Классификаторы', to: '/app/search?type=classifier' },
  { icon: CalendarDays, label: 'Календарь', to: '/app/services/calendar' },
  { icon: Info, label: 'Справочная', to: '/app/topics' },
  { icon: Bot, label: 'AI-помощник', to: '/app/assistant' },
];

const keyDocuments = [
  { title: 'Гражданский кодекс', query: 'Гражданский кодекс' },
  { title: 'Налоговый кодекс', query: 'Налоговый кодекс' },
  { title: 'Трудовой кодекс', query: 'Трудовой кодекс' },
  { title: 'Уголовный кодекс', query: 'Уголовный кодекс' },
  { title: 'КоАП', query: 'Кодекс об административных правонарушениях' },
  { title: 'Жилищный кодекс', query: 'Жилищный кодекс' },
];

const typeColors: Record<string, string> = {
  codex: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  law: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  decree: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolution: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Document types for tabs
  const { data: docTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await supabase.from('document_types').select('*').order('sort_order');
      return data || [];
    },
    staleTime: 3600000,
  });

  // User profile for recommendations
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // New documents (latest 10)
  const { data: newDocs, isLoading: loadingDocs } = useQuery({
    queryKey: ['new-documents', activeTab],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('id, title, short_title, doc_date, status, document_type_id, document_types(name_ru, slug), issuing_bodies(name_ru)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (activeTab !== 'all') {
        const type = docTypes?.find((t) => t.slug === activeTab);
        if (type) q = q.eq('document_type_id', type.id);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: activeTab === 'all' || !!docTypes,
  });

  // Articles
  const { data: articles } = useQuery({
    queryKey: ['latest-articles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, slug, title, excerpt, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  // Favorites
  const { data: favorites } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_favorites')
        .select('id, document_id, documents(id, title, short_title)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // View history
  const { data: history } = useQuery({
    queryKey: ['view-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_document_history')
        .select('id, document_id, viewed_at, documents(id, title, short_title)')
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Deadlines for calendar
  const { data: deadlines } = useQuery({
    queryKey: ['calendar-deadlines'],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data } = await supabase
        .from('deadline_calendar')
        .select('*')
        .gte('deadline_date', start)
        .lte('deadline_date', end);
      return data || [];
    },
  });

  const deadlineDates = useMemo(() => {
    if (!deadlines) return [];
    return deadlines.map((d) => new Date(d.deadline_date + 'T00:00:00'));
  }, [deadlines]);

  const selectedDayDeadlines = useMemo(() => {
    if (!deadlines || !calendarDate) return [];
    const sel = calendarDate.toISOString().split('T')[0];
    return deadlines.filter((d) => d.deadline_date === sel);
  }, [deadlines, calendarDate]);

  const tabSlugs = useMemo(() => {
    if (!docTypes) return [];
    return docTypes.slice(0, 4);
  }, [docTypes]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';

  return (
    <div className="space-y-6">
      {/* Quick Nav */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {quickNav.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex flex-col items-center gap-1.5 min-w-[72px] rounded-lg p-3 text-center hover:bg-accent transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6 min-w-0">
          {/* Recommendations */}
          {userProfile?.profession && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Рекомендации для вас
                  <Badge variant="secondary" className="ml-2 text-xs font-normal">
                    {userProfile.profession}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Настройте профессию в профиле для персональных рекомендаций.
                </p>
              </CardContent>
            </Card>
          )}

          {/* New documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Новые документы</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/app/search">
                  Все документы <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-3 h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">Все</TabsTrigger>
                  {tabSlugs.map((t) => (
                    <TabsTrigger key={t.slug} value={t.slug} className="text-xs px-3 h-7">
                      {t.name_ru}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {loadingDocs ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : newDocs && newDocs.length > 0 ? (
                <div className="space-y-2">
                  {newDocs.map((doc: any) => (
                    <Link
                      key={doc.id}
                      to={`/app/documents/${doc.id}`}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors group"
                    >
                      <Badge
                        variant="secondary"
                        className={`text-[11px] shrink-0 ${typeColors[doc.document_types?.slug] || ''}`}
                      >
                        {doc.document_types?.name_ru || 'Документ'}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm line-clamp-2">{doc.short_title || doc.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(doc.doc_date)}
                          {doc.issuing_bodies?.name_ru && ` • ${doc.issuing_bodies.name_ru}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Документы не найдены</p>
              )}
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Статьи и обзоры</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/news">
                  Все статьи <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {articles && articles.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {articles.map((a) => (
                    <Link
                      key={a.id}
                      to={`/news/${a.slug}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Newspaper className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{formatDate(a.published_at)}</span>
                      </div>
                      <p className="text-sm font-medium leading-tight line-clamp-2">{a.title}</p>
                      {a.excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Нет статей</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Key documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Важнейшие НПА</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {keyDocuments.map((doc) => (
                <Link
                  key={doc.query}
                  to={`/app/search?q=${encodeURIComponent(doc.query)}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors text-sm group"
                >
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{doc.title}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Favorites */}
          {user && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Избранные
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link to="/app/bookmarks">Все <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {favorites && favorites.length > 0 ? (
                  <div className="space-y-1">
                    {favorites.map((f: any) => (
                      <Link
                        key={f.id}
                        to={`/app/documents/${f.document_id}`}
                        className="block p-2 rounded-md hover:bg-accent text-sm truncate transition-colors"
                      >
                        {f.documents?.short_title || f.documents?.title || 'Документ'}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет избранных</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* View history */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Последние просмотренные
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-1">
                    {history.map((h: any) => (
                      <Link
                        key={h.id}
                        to={`/app/documents/${h.document_id}`}
                        className="block p-2 rounded-md hover:bg-accent text-sm truncate transition-colors"
                      >
                        {h.documents?.short_title || h.documents?.title || 'Документ'}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет истории</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mini calendar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Календарь дедлайнов</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/app/services/calendar">Открыть <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={setCalendarDate}
                className="p-0 pointer-events-auto"
                modifiers={{ deadline: deadlineDates }}
                modifiersClassNames={{
                  deadline: 'bg-destructive/20 text-destructive font-bold',
                }}
              />
              {selectedDayDeadlines.length > 0 && (
                <div className="w-full mt-3 space-y-1">
                  {selectedDayDeadlines.map((d) => (
                    <div key={d.id} className="text-xs p-2 rounded-md bg-muted">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-muted-foreground">{d.category}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
