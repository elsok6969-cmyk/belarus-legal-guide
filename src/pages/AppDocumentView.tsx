/**
 * App-internal document viewer.
 * Reuses PublicDocumentView but patches all internal links to /app/documents/...
 * and uses user_favorites instead of bookmarks for Избранное/На контроле.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Clock, Download, Share2, Star, Eye, Lock,
  ExternalLink, Search, ChevronLeft, ChevronRight,
  BookOpen, Menu, MoreVertical, MessageCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentTOCPanel, TocEntry } from '@/components/document/DocumentTOCPanel';
import { DocumentArticleRenderer } from '@/components/document/DocumentArticleRenderer';
import { DocumentSearchPanel } from '@/components/document/DocumentSearchPanel';
import { parseMarkdownIntoSections } from '@/lib/parseDocumentSections';
import { DocumentFreshness } from '@/components/document/DocumentFreshness';
import { DocumentAmendments } from '@/components/document/DocumentAmendments';
import { ContentGate } from '@/components/paywall/ContentGate';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface DocSection {
  id: string; title: string | null; number: string | null;
  content_markdown: string | null; content_text: string | null;
  level: number; sort_order: number; section_type: string; parent_id: string | null;
}

interface UnifiedSection {
  id: string; title: string | null; number: string | null;
  content: string; level: number; sort_order: number; section_type: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Действующий', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  expired: { label: 'Истёк', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  cancelled: { label: 'Отменён', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  not_effective_yet: { label: 'Не вступил в силу', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

const TYPE_CLS: Record<string, string> = {
  codex: 'bg-primary/15 text-primary',
  law: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  decree: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  resolution: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

function fmtDate(d: string | null) {
  if (!d) return '';
  try { return format(new Date(d), 'dd.MM.yyyy'); } catch { return d; }
}

export default function AppDocumentView() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'focus' | 'full'>('focus');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<{ sectionId: string; title: string }[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Document
  const { data: doc, isLoading } = useQuery({
    queryKey: ['app-doc', idOrSlug],
    queryFn: async () => {
      const { data: bySlug } = await supabase.from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('slug', idOrSlug!).maybeSingle();
      if (bySlug) return bySlug;
      const { data: byId } = await supabase.from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('id', idOrSlug!).maybeSingle();
      return byId;
    },
    enabled: !!idOrSlug,
    staleTime: 3600000,
  });

  const id = doc?.id;

  // Sections
  const { data: dbSections } = useQuery({
    queryKey: ['document-sections', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_sections')
        .select('id, title, number, level, sort_order, section_type, parent_id, content_markdown, content_text')
        .eq('document_id', id!)
        .order('sort_order');
      return (data || []) as DocSection[];
    },
    enabled: !!id,
    staleTime: 3600000,
  });

  // Relations
  const { data: relations } = useQuery({
    queryKey: ['document-relations', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_relations')
        .select('*, source:documents!document_relations_source_document_id_fkey(id, title, short_title, doc_date), target:documents!document_relations_target_document_id_fkey(id, title, short_title, doc_date)')
        .or(`source_document_id.eq.${id},target_document_id.eq.${id}`);
      return data || [];
    },
    enabled: !!id,
    staleTime: 3600000,
  });

  // User plan
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-plan', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles')
        .select('subscription_plan')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 300000,
  });

  // Favorites
  const { data: favorite } = useQuery({
    queryKey: ['user-favorite', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_favorites')
        .select('id, on_watch')
        .eq('user_id', user!.id)
        .eq('document_id', id!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !id) return;
      if (favorite) {
        await supabase.from('user_favorites').delete().eq('id', favorite.id);
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, document_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorite', id, user?.id] });
      toast.success(favorite ? 'Удалено из избранного' : 'Добавлено в избранное');
    },
  });

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!user || !id) return;
      if (favorite) {
        await supabase.from('user_favorites').update({ on_watch: !favorite.on_watch }).eq('id', favorite.id);
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, document_id: id, on_watch: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorite', id, user?.id] });
      toast.success(favorite?.on_watch ? 'Снято с контроля' : 'Документ на контроле');
    },
  });

  // Track view
  useEffect(() => {
    if (id && user) {
      supabase.from('user_document_history').upsert(
        { user_id: user.id, document_id: id, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,document_id' }
      ).then(() => {});
    }
  }, [id, user?.id]);

  // Sections logic
  const virtualSections = useMemo(() => {
    if (dbSections && dbSections.length > 0) return null;
    if (!doc?.content_markdown) return null;
    return parseMarkdownIntoSections(doc.content_markdown);
  }, [dbSections, doc?.content_markdown]);

  const paidPlans = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
  const isPaid = paidPlans.includes(userProfile?.subscription_plan || '');

  const sections: UnifiedSection[] = useMemo(() => {
    let raw: UnifiedSection[] = [];
    if (dbSections && dbSections.length > 0) {
      raw = dbSections.map(s => ({
        id: s.id, title: s.title, number: s.number,
        content: s.content_markdown || s.content_text || '',
        level: s.level, sort_order: s.sort_order, section_type: s.section_type,
      }));
    } else if (virtualSections && virtualSections.length > 0) {
      raw = virtualSections.map(s => ({
        id: s.id, title: s.title, number: null,
        content: s.content, level: s.level, sort_order: s.sort_order, section_type: 'article',
      }));
    }

    // Free users: 15 articles, paid: unlimited
    const sectionLimit = isPaid ? Infinity : 15;
    let articleCount = 0;
    return raw.map((s) => {
      const isStructural = s.section_type === 'part' || s.section_type === 'chapter' || s.section_type === 'section';
      if (isStructural) return s;
      articleCount++;
      if (articleCount <= sectionLimit) return s;
      return { ...s, content: '' };
    });
  }, [dbSections, virtualSections, isPaid]);

  const freeLimit = isPaid ? Infinity : 15;

  const tocSections: TocEntry[] = useMemo(
    () => sections.filter(s => s.level <= 3).map(s => ({
      id: s.id, title: s.title, number: s.number,
      level: s.level, sort_order: s.sort_order, section_type: s.section_type,
    })),
    [sections]
  );

  const articleIds = useMemo(() => sections.filter(s => s.level >= 2).map(s => s.id), [sections]);
  const currentArticleIndex = useMemo(() => focusedId ? articleIds.indexOf(focusedId) : -1, [articleIds, focusedId]);

  // Init from hash
  useEffect(() => {
    const hash = location.hash?.replace('#section-', '').replace('#', '');
    if (hash && sections.length > 0) {
      const found = sections.find(s => s.id === hash);
      if (found) { setFocusedId(hash); return; }
    }
    if (sections.length > 0 && !focusedId) {
      const first = sections.find(s => s.level >= 2);
      if (first) setFocusedId(first.id);
    }
  }, [sections, location.hash]);

  const handleSelectSection = useCallback((sectionId: string) => {
    if (viewMode === 'focus') {
      setFocusedId(sectionId);
      window.history.replaceState(null, '', `#section-${sectionId}`);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTocOpen(false);
  }, [viewMode]);

  const handleArticleRefClick = useCallback((artNum: string) => {
    const target = sections.find(s =>
      (s.number && s.number.match(new RegExp(`\\b${artNum}\\b`))) ||
      (s.title && new RegExp(`Статья\\s+${artNum}\\b`, 'i').test(s.title))
    );
    if (target) {
      setViewMode('focus');
      setFocusedId(target.id);
      window.history.replaceState(null, '', `#section-${target.id}`);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sections]);

  const goToArticle = useCallback((direction: 'prev' | 'next') => {
    const newIdx = direction === 'prev' ? currentArticleIndex - 1 : currentArticleIndex + 1;
    if (newIdx >= 0 && newIdx < articleIds.length) {
      setFocusedId(articleIds[newIdx]);
      window.history.replaceState(null, '', `#section-${articleIds[newIdx]}`);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentArticleIndex, articleIds]);

  const focusedSections = useMemo(() => {
    if (viewMode !== 'focus' || !focusedId) return null;
    const startIdx = sections.findIndex(s => s.id === focusedId);
    if (startIdx === -1) return null;
    const startLevel = sections[startIdx].level;
    const result = [sections[startIdx]];
    for (let i = startIdx + 1; i < sections.length; i++) {
      if (sections[i].level <= startLevel) break;
      result.push(sections[i]);
    }
    return result;
  }, [viewMode, focusedId, sections]);

  // Search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); setSearchMatches([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchMatches([]); return; }
    const lower = q.toLowerCase();
    const matches = sections
      .filter(s => s.content.toLowerCase().includes(lower) || (s.title || '').toLowerCase().includes(lower))
      .map(s => ({ sectionId: s.id, title: `${s.number ? s.number + ' ' : ''}${s.title || ''}` }));
    setSearchMatches(matches);
    setSearchIndex(0);
    if (matches.length > 0) { setViewMode('focus'); setFocusedId(matches[0].sectionId); }
  }, [sections]);

  const handleSearchNavigate = useCallback((dir: 'prev' | 'next') => {
    if (!searchMatches.length) return;
    const next = dir === 'next' ? (searchIndex + 1) % searchMatches.length : (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchIndex(next);
    setFocusedId(searchMatches[next].sectionId);
    setViewMode('focus');
  }, [searchMatches, searchIndex]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Ссылка скопирована');
  }, []);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-6 mt-6">
          <Skeleton className="h-[600px] w-[280px] hidden md:block" />
          <Skeleton className="h-[600px] flex-1" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Документ не найден</h1>
        <Link to="/app/new-documents" className="text-primary hover:underline">← К списку документов</Link>
      </div>
    );
  }

  const dt = doc.document_types as any;
  const ib = doc.issuing_bodies as any;
  const typeLabel = dt?.name_ru || '';
  const typeSlug = dt?.slug || '';
  const statusInfo = STATUS_MAP[doc.status] || { label: doc.status, cls: 'bg-muted text-muted-foreground' };

  const RELATION_LABELS: Record<string, string> = {
    amends: 'Изменяет', amended_by: 'Изменён', repeals: 'Отменяет',
    repealed_by: 'Отменён', references: 'Ссылается', referenced_by: 'Упомянут',
    supersedes: 'Заменяет', superseded_by: 'Заменён',
  };

  const displaySections = viewMode === 'focus' && focusedSections ? focusedSections : sections;

  return (
    <div className="md:h-[calc(100vh-3.5rem-3rem)] md:flex md:flex-col md:overflow-hidden">
      {showSearch && (
        <DocumentSearchPanel
          matches={searchMatches}
          currentIndex={searchIndex}
          onSearch={handleSearch}
          onNavigate={handleSearchNavigate}
          onClose={() => { setShowSearch(false); setSearchQuery(''); setSearchMatches([]); }}
        />
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_CLS[typeSlug] || 'bg-muted text-muted-foreground'}`}>
            {typeLabel}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.cls}`}>
            ● {statusInfo.label}
          </span>
        </div>

        <h1 className="text-lg md:text-2xl font-bold leading-snug mb-2">{doc.title}</h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          {doc.doc_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Принят: {fmtDate(doc.doc_date)}</span>}
          {doc.doc_number && <span>№ {doc.doc_number}</span>}
          {ib && <span className="hidden md:inline">{ib.name_ru}</span>}
          {doc.source_url && (
            <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3 w-3" />Источник
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={favorite ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => toggleFavorite.mutate()}
          >
            <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
            {favorite ? 'В избранном' : 'Избранное'}
          </Button>
          <Button
            variant={favorite?.on_watch ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => toggleWatch.mutate()}
          >
            <Eye className={`h-4 w-4 ${favorite?.on_watch ? 'fill-current' : ''}`} />
            {favorite?.on_watch ? 'На контроле' : 'На контроль'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />Поделиться
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4" />Поиск
          </Button>
        </div>

        {/* Mobile TOC */}
        {tocSections.length > 0 && (
          <Sheet open={tocOpen} onOpenChange={setTocOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden w-full flex items-center justify-between border rounded-lg px-4 py-3 text-sm font-medium mt-3 bg-background hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Menu className="h-4 w-4 text-muted-foreground" />
                  Содержание
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <DocumentTOCPanel sections={tocSections} activeId={focusedId} onSelect={handleSelectSection} mode={viewMode} freeLimit={freeLimit} />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Three-column */}
      <div className="flex gap-6 md:flex-1 md:min-h-0">
        {!isMobile && tocSections.length > 0 && (
          <aside className="hidden md:block w-[260px] shrink-0 overflow-y-auto border-r pr-4">
            <DocumentTOCPanel sections={tocSections} activeId={focusedId} onSelect={handleSelectSection} mode={viewMode} freeLimit={freeLimit} />
          </aside>
        )}

        <div className="flex-1 min-w-0 max-w-[820px] mx-auto overflow-visible md:overflow-y-auto">
          {sections.length > 0 && (
            <div className="mb-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'focus' | 'full')}>
                <TabsList className="grid w-full max-w-xs grid-cols-2">
                  <TabsTrigger value="focus">Текст документа</TabsTrigger>
                  <TabsTrigger value="full">Весь текст</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {viewMode === 'focus' && focusedSections && focusedSections[0] && (
            <div className="mb-4">
              <Badge variant="secondary" className="font-normal text-xs">
                {focusedSections[0].number ? `${focusedSections[0].number} ` : ''}{focusedSections[0].title || ''}
              </Badge>
            </div>
          )}

          {sections.length > 0 ? (
            <Card className="border rounded-xl">
              <CardContent className="p-6 md:p-8 font-serif leading-relaxed" ref={contentRef}>
                <div className="max-w-none">
                  {displaySections.map((section, idx) => {
                    const isStructural = section.section_type === 'part' || section.section_type === 'chapter' || section.section_type === 'section';
                    if (isStructural) {
                      return (
                        <DocumentArticleRenderer
                          key={section.id} id={section.id} title={section.title}
                          number={section.number} content={section.content}
                          level={section.level} sectionType={section.section_type}
                          searchQuery={searchQuery}
                        />
                      );
                    }
                    const globalArticleIdx = sections
                      .filter(s => s.section_type !== 'part' && s.section_type !== 'chapter' && s.section_type !== 'section')
                      .findIndex(s => s.id === section.id);
                    return (
                      <ContentGate
                        key={section.id}
                        sectionIndex={globalArticleIdx >= 0 ? globalArticleIdx : idx}
                        sectionTitle={section.title}
                        sectionNumber={section.number}
                        documentTitle={doc.title}
                        totalSections={sections.length}
                        userPlan={userProfile?.subscription_plan}
                        renderContent={() => (
                          <DocumentArticleRenderer
                            id={section.id} title={section.title}
                            number={section.number} content={section.content}
                            level={section.level} sectionType={section.section_type}
                            searchQuery={searchQuery}
                            onArticleClick={handleArticleRefClick}
                          />
                        )}
                      />
                    );
                  })}
                </div>

                {viewMode === 'focus' && articleIds.length > 0 && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t">
                    <Button variant="outline" size="sm" className="gap-1" disabled={currentArticleIndex <= 0} onClick={() => goToArticle('prev')}>
                      <ChevronLeft className="h-4 w-4" />Предыдущая
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentArticleIndex >= 0 ? `${currentArticleIndex + 1} из ${articleIds.length}` : ''}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1" disabled={currentArticleIndex >= articleIds.length - 1} onClick={() => goToArticle('next')}>
                      Следующая<ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Текст документа пока не загружен.</p>
              </CardContent>
            </Card>
          )}

          <DocumentFreshness lastUpdated={doc.last_updated} sourceUrl={doc.source_url} />
        </div>

        {/* Right sidebar */}
        {!isMobile && (
          <aside className="hidden lg:block w-[260px] shrink-0 overflow-y-auto space-y-4">
            {relations && relations.length > 0 && (
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />Связанные документы
                  </h3>
                  <div className="space-y-2.5">
                    {relations.slice(0, 8).map((rel: any) => {
                      const isSource = rel.source_document_id === id;
                      const linked = isSource ? rel.target : rel.source;
                      if (!linked) return null;
                      return (
                        <Link key={rel.id} to={`/app/documents/${linked.id}`} className="block text-xs hover:text-primary transition-colors">
                          <Badge variant="outline" className="text-[10px] mb-0.5">
                            {RELATION_LABELS[rel.relation_type] || rel.relation_type}
                          </Badge>
                          <p className="line-clamp-2">{linked.short_title || linked.title}</p>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            <DocumentAmendments documentId={id!} onArticleClick={handleArticleRefClick} />
          </aside>
        )}
      </div>

      {isMobile && (
        <div className="mt-6 space-y-4">
          <DocumentAmendments documentId={id!} onArticleClick={handleArticleRefClick} />
          {relations && relations.length > 0 && (
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Связанные документы</h3>
                <div className="space-y-2">
                  {relations.slice(0, 5).map((rel: any) => {
                    const isSource = rel.source_document_id === id;
                    const linked = isSource ? rel.target : rel.source;
                    if (!linked) return null;
                    return (
                      <Link key={rel.id} to={`/app/documents/${linked.id}`} className="block text-xs hover:text-primary">
                        <p className="line-clamp-2">{linked.short_title || linked.title}</p>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
