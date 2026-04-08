import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Calendar, Bookmark, BookmarkCheck, ArrowLeft, ExternalLink,
  Bell, BellOff, Scale, Search, List, Copy, Share2, Menu,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { DocumentTOC } from '@/components/document/DocumentTOC';
import { DocumentSearchBar } from '@/components/document/DocumentSearchBar';
import { DocumentSidebar } from '@/components/document/DocumentSidebar';
import { parseMarkdownIntoSections, getTocSections, VirtualSection } from '@/lib/parseDocumentSections';
import { DocumentFreshness } from '@/components/document/DocumentFreshness';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const TYPE_COLORS: Record<string, string> = {
  codex: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  law: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  decree: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  resolution: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

interface DocSection {
  id: string;
  title: string | null;
  number: string | null;
  content_markdown: string | null;
  content_text: string | null;
  level: number;
  sort_order: number;
  section_type: string;
  parent_id: string | null;
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showSearch, setShowSearch] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Ctrl+F override
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    staleTime: 3600000,
  });

  const { data: dbSections } = useQuery({
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
    staleTime: 3600000,
  });

  // Parse virtual sections from markdown when DB sections are empty
  const virtualSections = useMemo(() => {
    if (dbSections && dbSections.length > 0) return null;
    if (!doc?.content_markdown) return null;
    return parseMarkdownIntoSections(doc.content_markdown);
  }, [dbSections, doc?.content_markdown]);

  const hasDbSections = dbSections && dbSections.length > 0;
  const hasVirtualSections = virtualSections && virtualSections.length > 0;
  const hasSections = hasDbSections || hasVirtualSections;

  // Unified TOC sections for the sidebar
  const tocSections = useMemo(() => {
    if (hasDbSections) {
      return dbSections.filter(s => s.level <= 3).map(s => ({
        id: s.id,
        title: s.number ? `${s.number} ${s.title || ''}` : s.title,
        number: s.number,
        level: s.level,
        sort_order: s.sort_order,
        section_type: s.section_type,
        parent_id: s.parent_id,
      }));
    }
    if (hasVirtualSections) {
      return getTocSections(virtualSections).map(s => ({
        id: s.id,
        title: s.title,
        number: null as string | null,
        level: s.level,
        sort_order: s.sort_order,
        section_type: 'virtual',
        parent_id: null as string | null,
      }));
    }
    return [];
  }, [hasDbSections, dbSections, hasVirtualSections, virtualSections]);

  const { data: bookmark } = useQuery({
    queryKey: ['bookmark', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('bookmarks').select('id').eq('document_id', id!).eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('id').eq('document_id', id!).eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  // View history tracking with 5-min dedup
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: last } = await supabase
        .from('user_document_history')
        .select('viewed_at')
        .eq('document_id', id)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      if (!last || last.viewed_at < fiveMinAgo) {
        await supabase.from('user_document_history').insert({ document_id: id, user_id: user.id });
      }
    })();
  }, [id, user]);

  // Intersection Observer for active section tracking
  useEffect(() => {
    if (!hasSections) return;
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const sectionId = visible[0].target.id.replace('section-', '');
          setActiveSection(sectionId);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    // Delay to wait for refs to be populated
    setTimeout(() => {
      Object.values(sectionRefs.current).forEach(el => {
        if (el) observerRef.current!.observe(el);
      });
    }, 100);

    return () => observerRef.current?.disconnect();
  }, [hasSections, dbSections, virtualSections]);

  // Handle hash navigation on load
  useEffect(() => {
    if (!hasSections) return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    // Try to find matching section by hash
    setTimeout(() => {
      // First try exact ID match
      const el = document.getElementById(`section-${hash}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      // Try matching by chapter number from hash like "chapter-6"
      const chapterMatch = hash.match(/chapter-(\d+)/);
      if (chapterMatch && hasVirtualSections) {
        const chNum = chapterMatch[1];
        const target = virtualSections.find(s =>
          s.title.match(new RegExp(`ГЛАВА\\s+${chNum}\\b`, 'i'))
        );
        if (target) {
          const targetEl = document.getElementById(`section-${target.id}`);
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 300);
  }, [hasSections, hasVirtualSections, virtualSections]);

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

  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId] || document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!id) return;
    setSearchLoading(true);

    // If we have virtual sections, do client-side search
    if (hasVirtualSections && virtualSections) {
      const q = query.toLowerCase();
      const results = virtualSections
        .filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
        .map(s => {
          const idx = s.content.toLowerCase().indexOf(q);
          const snippet = idx >= 0
            ? '...' + s.content.substring(Math.max(0, idx - 40), idx + query.length + 40) + '...'
            : s.title;
          return { section_id: s.id, title: s.title, snippet };
        });
      setSearchResults(results);
      setSearchIndex(0);
      setSearchLoading(false);
      if (results.length) scrollToSection(results[0].section_id);
      return;
    }

    // DB sections: use RPC
    const { data } = await supabase.rpc('search_within_document', {
      p_document_id: id,
      search_query: query,
    });
    setSearchResults(data || []);
    setSearchIndex(0);
    setSearchLoading(false);
    if (data?.length) scrollToSection(data[0].section_id);
  }, [id, scrollToSection, hasVirtualSections, virtualSections]);

  const handleSearchNavigate = useCallback((dir: 'prev' | 'next') => {
    if (!searchResults.length) return;
    const next = dir === 'next'
      ? (searchIndex + 1) % searchResults.length
      : (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(next);
    scrollToSection(searchResults[next].section_id);
  }, [searchResults, searchIndex, scrollToSection]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Ссылка скопирована' });
  }, []);

  const copySectionText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Текст скопирован' });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full" />
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
  const typeSlug = dt?.slug || '';

  const tocContent = tocSections.length > 1 ? (
    <DocumentTOC sections={tocSections} activeSection={activeSection} onScrollTo={scrollToSection} />
  ) : null;

  const renderSectionHeading = (title: string, level: number) => {
    if (level <= 0) {
      return (
        <h2 className="text-lg font-bold text-primary border-b border-border pb-2 mt-8 first:mt-0 uppercase tracking-wide">
          {title}
        </h2>
      );
    }
    if (level === 1) {
      return (
        <h3 className="text-base font-bold text-foreground mt-8 mb-2 uppercase">
          {title}
        </h3>
      );
    }
    if (level === 2) {
      return (
        <h4 className="text-base font-semibold text-foreground mt-6 mb-2">
          {title}
        </h4>
      );
    }
    return (
      <h5 className="text-sm font-semibold text-foreground mt-4 mb-1">
        {title}
      </h5>
    );
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Главная', href: '/app' },
        ...(dt ? [{ label: dt.name_ru, href: `/app/search?type=${dt.slug}` }] : []),
        { label: doc.short_title || doc.title },
      ]} />

      {/* Document header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {dt && (
            <Badge className={TYPE_COLORS[typeSlug] || 'bg-secondary text-secondary-foreground'} variant="secondary">
              {dt.name_ru}
            </Badge>
          )}
          <Badge className={STATUS_COLORS[doc.status] || ''} variant="secondary">
            {STATUS_LABELS[doc.status] || doc.status}
          </Badge>
          {doc.doc_number && <span className="text-sm text-muted-foreground">№ {doc.doc_number}</span>}
        </div>

        <h1 className="text-xl font-bold tracking-tight leading-tight mb-3">{doc.title}</h1>

        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mb-4">
          {doc.doc_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(doc.doc_date).toLocaleDateString('ru-RU')}
            </span>
          )}
          {doc.effective_date && (
            <span className="flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" />
              Вступил: {new Date(doc.effective_date).toLocaleDateString('ru-RU')}
            </span>
          )}
          {ib && (
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {ib.name_ru}
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {user && (
            <>
              <Button variant={bookmark ? 'default' : 'outline'} size="sm" onClick={() => toggleBookmark.mutate()} disabled={toggleBookmark.isPending}>
                {bookmark ? <BookmarkCheck className="mr-1 h-4 w-4" /> : <Bookmark className="mr-1 h-4 w-4" />}
                {bookmark ? 'В закладках' : 'В закладки'}
              </Button>
              <Button variant={subscription ? 'default' : 'outline'} size="sm" onClick={() => toggleSubscription.mutate()} disabled={toggleSubscription.isPending}>
                {subscription ? <BellOff className="mr-1 h-4 w-4" /> : <Bell className="mr-1 h-4 w-4" />}
                {subscription ? 'Отписаться' : 'Следить'}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="mr-1 h-4 w-4" /> Копировать ссылку
          </Button>
          {doc.source_url && (
            <Button asChild variant="outline" size="sm">
              <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> Источник
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
            <Search className="mr-1 h-4 w-4" /> Поиск
          </Button>
          {isMobile && tocContent && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="mr-1 h-4 w-4" /> Оглавление
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="pt-10">{tocContent}</div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* In-document search bar */}
      {showSearch && (
        <DocumentSearchBar
          results={searchResults}
          currentIndex={searchIndex}
          isLoading={searchLoading}
          onSearch={handleSearch}
          onNavigate={handleSearchNavigate}
          onClose={() => { setShowSearch(false); setSearchResults([]); }}
        />
      )}

      {/* Three-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: TOC */}
        {!isMobile && tocContent && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <Card>
                <div className="p-3 border-b">
                  <p className="text-sm font-semibold">Оглавление</p>
                </div>
                {tocContent}
              </Card>
            </div>
          </aside>
        )}

        {/* Center: Document content */}
        <div className="flex-1 min-w-0">
          {/* Virtual sections (parsed from markdown) */}
          {hasVirtualSections ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="max-w-[800px] mx-auto">
          {virtualSections.map(section => (
                    <section
                      key={section.id}
                      ref={el => { sectionRefs.current[section.id] = el; }}
                      id={`section-${section.id}`}
                      className="scroll-mt-24 relative group pb-6 mb-6 border-b border-border/40 last:border-0 last:mb-0 last:pb-0"
                      onMouseEnter={() => setHoveredSection(section.id)}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      {renderSectionHeading(section.title, section.level)}
                      {section.content && (
                        <div className="text-[15px] md:text-base leading-[1.8] font-serif text-foreground/90 whitespace-pre-line">
                          {section.content}
                        </div>
                      )}
                      {section.level === 3 && (
                        <div className="border-b border-border/30 mt-4 mb-2" />
                      )}
                      {hoveredSection === section.id && section.content && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copySectionText(section.content)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </section>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : hasDbSections ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="max-w-[800px] mx-auto">
                  {dbSections!.map(section => {
                    const sectionContent = section.content_markdown || section.content_text || '';
                    return (
                      <section
                        key={section.id}
                        ref={el => { sectionRefs.current[section.id] = el; }}
                        id={`section-${section.id}`}
                        className="scroll-mt-24 relative group pb-6 mb-6 border-b border-border/40 last:border-0 last:mb-0 last:pb-0"
                        onMouseEnter={() => setHoveredSection(section.id)}
                        onMouseLeave={() => setHoveredSection(null)}
                      >
                        {(section.number || section.title) && (
                          <h2 className={`mb-3 ${
                            section.level <= 1
                              ? 'text-lg md:text-xl font-bold text-primary border-b border-border pb-2 mt-8 first:mt-0'
                              : section.level === 2
                              ? 'text-base md:text-lg font-semibold text-foreground mt-6'
                              : 'text-sm md:text-base font-semibold text-foreground mt-4'
                          }`}>
                            {section.number && <span className="font-bold">{section.number} </span>}
                            {section.title}
                          </h2>
                        )}
                        {section.content_markdown ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-a:text-primary text-[15px] md:text-base leading-[1.8] font-serif">
                            <ReactMarkdown>{section.content_markdown}</ReactMarkdown>
                          </div>
                        ) : section.content_text ? (
                          <div className="text-[15px] md:text-base leading-[1.8] font-serif text-foreground/90 whitespace-pre-line">
                            {section.content_text}
                          </div>
                        ) : null}
                        {hoveredSection === section.id && sectionContent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copySectionText(sectionContent)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </section>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : doc.content_markdown ? (
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-a:text-primary text-sm leading-relaxed max-w-[800px] mx-auto">
                  <ReactMarkdown>{doc.content_markdown}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Текст документа загружается...</p>
              </CardContent>
            </Card>
          )}

          {/* Freshness disclaimer */}
          <DocumentFreshness lastUpdated={doc.last_updated} sourceUrl={doc.source_url} />

          {/* Mobile: sidebar content below document */}
          {isMobile && (
            <div className="mt-6">
              <DocumentSidebar documentId={id!} />
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        {!isMobile && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <DocumentSidebar documentId={id!} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
