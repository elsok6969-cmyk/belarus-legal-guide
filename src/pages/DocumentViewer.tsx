import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, Bookmark, BookmarkCheck, ArrowLeft, ExternalLink, Bell, BellOff, Scale, ChevronRight, Search, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useState, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  not_effective_yet: 'Не вступил в силу',
  expired: 'Истёк',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_effective_yet: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

interface DocSection {
  id: string;
  title: string | null;
  number: string | null;
  content_markdown: string | null;
  level: number;
  sort_order: number;
  section_type: string;
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showTOC, setShowTOC] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: sections } = useQuery({
    queryKey: ['document-sections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', id!)
        .order('sort_order');
      if (error) throw error;
      return data as DocSection[];
    },
    enabled: !!id,
  });

  const { data: bookmark } = useQuery({
    queryKey: ['bookmark', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('document_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('document_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (bookmark) {
        await supabase.from('bookmarks').delete().eq('id', bookmark.id);
      } else {
        await supabase.from('bookmarks').insert({ document_id: id!, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', id] });
      toast({ title: bookmark ? 'Закладка удалена' : 'Добавлено в закладки' });
    },
  });

  const toggleSubscription = useMutation({
    mutationFn: async () => {
      if (subscription) {
        await supabase.from('subscriptions').delete().eq('id', subscription.id);
      } else {
        await supabase.from('subscriptions').insert({ document_id: id!, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast({ title: subscription ? 'Подписка отменена' : 'Вы подписаны на обновления' });
    },
  });

  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase();
    return sections.filter(
      (s) =>
        s.title?.toLowerCase().includes(term) ||
        s.number?.toLowerCase().includes(term) ||
        s.content_markdown?.toLowerCase().includes(term)
    );
  }, [sections, searchTerm]);

  const tocItems = useMemo(() => {
    if (!sections) return [];
    return sections.filter((s) => s.level <= 2);
  }, [sections]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Документ не найден</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/app/search">← Вернуться к поиску</Link>
        </Button>
      </div>
    );
  }

  const dt = doc.document_types as any;
  const ib = doc.issuing_bodies as any;
  const hasSections = sections && sections.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/search">
            <ArrowLeft className="mr-1 h-4 w-4" /> Назад
          </Link>
        </Button>
      </div>

      <div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight leading-tight">{doc.title}</h1>
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            {dt && <Badge variant="outline">{dt.name_ru}</Badge>}
            {doc.doc_number && <span>№ {doc.doc_number}</span>}
            <Badge className={STATUS_COLORS[doc.status] || ''} variant="secondary">
              {STATUS_LABELS[doc.status] || doc.status}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {user && (
            <>
              <Button
                variant={bookmark ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleBookmark.mutate()}
                disabled={toggleBookmark.isPending}
              >
                {bookmark ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {bookmark ? 'В закладках' : 'В закладки'}
              </Button>
              <Button
                variant={subscription ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSubscription.mutate()}
                disabled={toggleSubscription.isPending}
              >
                {subscription ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
                {subscription ? 'Отписаться' : 'Следить'}
              </Button>
            </>
          )}
          {doc.source_url && (
            <Button asChild variant="outline" size="sm">
              <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Источник
              </a>
            </Button>
          )}
          {hasSections && (
            <Button variant="outline" size="sm" onClick={() => setShowTOC(!showTOC)}>
              <List className="mr-2 h-4 w-4" />
              {showTOC ? 'Скрыть оглавление' : 'Оглавление'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {doc.doc_date && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Дата принятия</p>
                <p className="text-sm font-medium">{new Date(doc.doc_date).toLocaleDateString('ru-RU')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {doc.effective_date && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Дата вступления в силу</p>
                <p className="text-sm font-medium">{new Date(doc.effective_date).toLocaleDateString('ru-RU')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {ib && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Орган</p>
                <p className="text-sm font-medium">{ib.name_ru}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {hasSections && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по тексту документа..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Найдено: {filteredSections.length}
            </span>
          )}
        </div>
      )}

      {hasSections ? (
        <div className="flex gap-6">
          {showTOC && tocItems.length > 1 && (
            <aside className="hidden lg:block w-72 shrink-0">
              <Card className="sticky top-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Оглавление</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[60vh] px-4 pb-4">
                    <nav className="space-y-0.5">
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors hover:bg-accent ${
                            item.level <= 1 ? 'font-semibold text-foreground' : 'text-muted-foreground pl-4'
                          } ${activeSection === item.id ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          {item.number ? `${item.number} ${item.title || ''}` : item.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            <Card>
              <CardContent className="p-6 space-y-6">
                {filteredSections.map((section) => (
                  <div
                    key={section.id}
                    ref={(el) => { sectionRefs.current[section.id] = el; }}
                    id={`section-${section.id}`}
                    className="scroll-mt-4"
                  >
                    {(section.number || section.title) && (
                      <h2
                        className={`font-bold mb-3 ${
                          section.level <= 1
                            ? 'text-lg text-primary border-b border-border pb-2 mt-6 first:mt-0'
                            : section.level === 2
                            ? 'text-base text-foreground mt-4'
                            : 'text-sm text-foreground mt-3'
                        }`}
                      >
                        {section.number && <span>{section.number} </span>}
                        {section.title}
                      </h2>
                    )}
                    {section.content_markdown && (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-a:text-primary prose-p:leading-[1.8] prose-p:text-muted-foreground">
                        <ReactMarkdown>{section.content_markdown}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : doc.content_markdown ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Текст документа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-a:text-primary prose-p:leading-[1.8] prose-p:text-muted-foreground">
              <ReactMarkdown>{doc.content_markdown}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Текст документа загружается...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Полный текст будет доступен после обработки
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
