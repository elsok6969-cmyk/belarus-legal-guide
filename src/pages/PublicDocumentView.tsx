import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Clock, Download, Share2, Bookmark, Bell, Lock,
  ExternalLink, Mail, Search, ChevronLeft, ChevronRight,
  BookOpen, Menu, MoreHorizontal, MessageCircle, MoreVertical,
} from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentTOCPanel, TocEntry } from '@/components/document/DocumentTOCPanel';
import { DocumentArticleRenderer } from '@/components/document/DocumentArticleRenderer';
import { DocumentSearchPanel } from '@/components/document/DocumentSearchPanel';
import { parseMarkdownIntoSections, getTocSections, VirtualSection } from '@/lib/parseDocumentSections';
import { DocumentFreshness } from '@/components/document/DocumentFreshness';
import { DocumentAmendments } from '@/components/document/DocumentAmendments';
import { ContentGate } from '@/components/paywall/ContentGate';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { getSessionId } from '@/hooks/useVisitTracking';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* ─── types ─────────────────────────────────────── */

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

interface UnifiedSection {
  id: string;
  title: string | null;
  number: string | null;
  content: string;
  level: number;
  sort_order: number;
  _snippet?: string;
}

/* ─── helpers ───────────────────────────────────── */

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

function formatDate(d: string | null) {
  if (!d) return '';
  try { return format(new Date(d), 'dd.MM.yyyy'); } catch { return d; }
}

/* ─── main component ────────────────────────────── */

export default function PublicDocumentView() {
  const { id: idOrSlug } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [viewMode, setViewMode] = useState<'focus' | 'full'>('focus');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<{ sectionId: string; title: string }[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── data fetching ── */

  const { data: doc, isLoading } = useQuery({
    queryKey: ['public-doc', idOrSlug],
    queryFn: async () => {
      // Try slug first
      const { data: bySlug } = await supabase.from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('slug', idOrSlug!)
        .maybeSingle();
      if (bySlug) return bySlug;
      // Fallback to id
      const { data: byId } = await supabase.from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('id', idOrSlug!)
        .maybeSingle();
      return byId;
    },
    enabled: !!idOrSlug,
    staleTime: 3600000,
  });

  const id = doc?.id;

  const { data: dbSections } = useQuery({
    queryKey: ['document-sections', id],
    queryFn: async () => {
      // Only fetch metadata + truncated content preview for TOC/gating
      // Full content is fetched separately for allowed sections
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

  const { data: isBookmarked } = useQuery({
    queryKey: ['bookmark', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user!.id).eq('document_id', id!).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const { data: isSubscribed } = useQuery({
    queryKey: ['subscription', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('id').eq('user_id', user!.id).eq('document_id', id!).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Get user plan for ContentGate
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


  const virtualSections = useMemo(() => {
    if (dbSections && dbSections.length > 0) return null;
    if (!doc?.content_markdown) return null;
    return parseMarkdownIntoSections(doc.content_markdown);
  }, [dbSections, doc?.content_markdown]);

  const sections: UnifiedSection[] = useMemo(() => {
    let raw: UnifiedSection[] = [];
    if (dbSections && dbSections.length > 0) {
      raw = dbSections.map(s => ({
        id: s.id,
        title: s.title,
        number: s.number,
        content: s.content_markdown || s.content_text || '',
        level: s.level,
        sort_order: s.sort_order,
      }));
    } else if (virtualSections && virtualSections.length > 0) {
      raw = virtualSections.map(s => ({
        id: s.id,
        title: s.title,
        number: null,
        content: s.content,
        level: s.level,
        sort_order: s.sort_order,
      }));
    }

    // Determine access limit: guest=5, free=10, paid=∞
    const paidPlans = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
    const isPaid = paidPlans.includes(userProfile?.subscription_plan || '');

    let sectionLimit = Infinity;
    if (!user) {
      sectionLimit = 5;
    } else if (!isPaid) {
      sectionLimit = 10;
    }

    return raw.map((s, idx) => {
      if (idx < sectionLimit) return s; // Full content
      // Gated: strip content entirely from DOM
      return {
        ...s,
        content: '', // No content in DOM at all
      };
    });
  }, [dbSections, virtualSections, user, userProfile?.subscription_plan, doc?.title]);

  const freeLimit = useMemo(() => {
    const paidPlans = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
    const isPaid = paidPlans.includes(userProfile?.subscription_plan || '');
    if (!user) return 5;
    if (!isPaid) return 10;
    return Infinity;
  }, [user, userProfile?.subscription_plan]);

  const tocSections: TocEntry[] = useMemo(
    () => sections.filter(s => s.level <= 3).map(s => ({
      id: s.id,
      title: s.title,
      number: s.number,
      level: s.level,
      sort_order: s.sort_order,
    })),
    [sections]
  );

  /* ── navigation helpers ── */

  // Articles are sections with level >= 2 (chapters level 2, articles level 3)
  const articleIds = useMemo(
    () => sections.filter(s => s.level >= 2).map(s => s.id),
    [sections]
  );

  const currentArticleIndex = useMemo(
    () => focusedId ? articleIds.indexOf(focusedId) : -1,
    [articleIds, focusedId]
  );

  // Initialize from hash
  useEffect(() => {
    const hash = location.hash?.replace('#section-', '').replace('#', '');
    if (hash && sections.length > 0) {
      const found = sections.find(s => s.id === hash);
      if (found) {
        setFocusedId(hash);
        return;
      }
      // Try article-N pattern
      const artMatch = hash.match(/article-(\d+)/);
      if (artMatch) {
        const artNum = artMatch[1];
        const match = sections.find(s =>
          (s.number && s.number.includes(artNum)) ||
          (s.title && new RegExp(`Статья\\s+${artNum}\\b`, 'i').test(s.title))
        );
        if (match) { setFocusedId(match.id); return; }
      }
    }
    // Default: focus on first article-level section
    if (sections.length > 0 && !focusedId) {
      const firstArticle = sections.find(s => s.level >= 2);
      if (firstArticle) setFocusedId(firstArticle.id);
    }
  }, [sections, location.hash]);

  const handleSelectSection = useCallback((sectionId: string) => {
    // Check if this section is gated — if so, scroll to paywall
    const sIdx = sections.findIndex(s => s.id === sectionId);
    const paidPlans = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
    const isPaid = paidPlans.includes(userProfile?.subscription_plan || '');
    const limit = !user ? 5 : isPaid ? Infinity : 10;

    if (sIdx >= limit) {
      // In focus mode, navigate to the locked section — ContentGate will show paywall
      if (viewMode === 'focus') {
        setFocusedId(sectionId);
        window.history.replaceState(null, '', `#section-${sectionId}`);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setTocOpen(false);
        return;
      }
      // In full mode, scroll to paywall gate
      const gate = document.getElementById('paywall-gate');
      if (gate) gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTocOpen(false);
      return;
    }

    if (viewMode === 'focus') {
      setFocusedId(sectionId);
      window.history.replaceState(null, '', `#section-${sectionId}`);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTocOpen(false);
  }, [viewMode, sections, user, userProfile?.subscription_plan]);

  const handleArticleRefClick = useCallback((artNum: string) => {
    const target = sections.find(s => {
      if (s.number && s.number.match(new RegExp(`\\b${artNum}\\b`))) return true;
      if (s.title && new RegExp(`Статья\\s+${artNum}\\b`, 'i').test(s.title)) return true;
      return false;
    });
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
      const newId = articleIds[newIdx];
      setFocusedId(newId);
      window.history.replaceState(null, '', `#section-${newId}`);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentArticleIndex, articleIds]);

  /* ── focused sections logic ── */

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

  /* ── search ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setSearchMatches([]);
      }
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
    if (matches.length > 0) {
      setViewMode('focus');
      setFocusedId(matches[0].sectionId);
    }
  }, [sections]);

  const handleSearchNavigate = useCallback((dir: 'prev' | 'next') => {
    if (!searchMatches.length) return;
    const next = dir === 'next'
      ? (searchIndex + 1) % searchMatches.length
      : (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchIndex(next);
    setFocusedId(searchMatches[next].sectionId);
    setViewMode('focus');
  }, [searchMatches, searchIndex]);

  /* ── actions ── */

  const toggleBookmark = useCallback(async () => {
    if (!user || !id) { toast.error('Войдите, чтобы добавить в избранное'); return; }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('document_id', id);
      toast('Удалено из избранного');
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, document_id: id });
      toast.success('Добавлено в избранное');
    }
  }, [user, id, isBookmarked]);

  const toggleSubscription = useCallback(async () => {
    if (!user || !id) { toast.error('Войдите, чтобы подписаться'); return; }
    if (isSubscribed) {
      await supabase.from('subscriptions').delete().eq('user_id', user.id).eq('document_id', id);
      toast('Подписка отменена');
    } else {
      await supabase.from('subscriptions').insert({ user_id: user.id, document_id: id });
      toast.success('Вы подписаны на изменения');
    }
  }, [user, id, isSubscribed]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Ссылка скопирована');
  }, []);

  const handleAIExplain = useCallback((title: string, content: string) => {
    toast.info('AI-объяснение будет доступно в следующем обновлении');
  }, []);

  /* ── access ── */
  // Track content view
  useEffect(() => {
    if (id) {
      const sid = getSessionId();
      supabase.from('content_views').insert({
        session_id: sid,
        user_id: user?.id || null,
        page_url: `/documents/${id}`,
      }).then(() => {});
    }
  }, [id, user?.id]);


  /* ── loading / error ── */

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="flex gap-6">
          <Skeleton className="h-[600px] w-[280px] hidden md:block" />
          <Skeleton className="h-[600px] flex-1" />
          <Skeleton className="h-[400px] w-[280px] hidden lg:block" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Документ не найден</h1>
        <Link to="/documents" className="text-primary hover:underline">← К списку документов</Link>
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

  const paidPlansCheck = ['personal', 'corporate', 'basic', 'professional', 'enterprise'];
  const showPaywall = !paidPlansCheck.includes(userProfile?.subscription_plan || '');

  const legalDocJsonLd: any = {
    '@context': 'https://schema.org', '@type': 'Legislation',
    name: doc.title, legislationIdentifier: doc.doc_number,
    datePublished: doc.doc_date, dateModified: doc.last_updated,
    publisher: ib ? { '@type': 'Organization', name: ib.name_ru } : undefined,
    inLanguage: 'ru', legislationJurisdiction: 'BY',
    url: `https://babijon.by/documents/${doc.slug || doc.id}`,
    legislationLegalForce: doc.status === 'active' ? 'InForce' : 'NotInForce',
  };

  if (showPaywall) {
    legalDocJsonLd.isAccessibleForFree = false;
    legalDocJsonLd.hasPart = {
      '@type': 'WebPageElement',
      isAccessibleForFree: true,
      cssSelector: '.free-content',
    };
  }

  const displaySections = viewMode === 'focus' && focusedSections
    ? focusedSections
    : sections;

  const docPath = `/documents/${doc.slug || doc.id}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:h-screen md:flex md:flex-col md:overflow-hidden">
      <PageSEO
        title={`${doc.title} | Бабиджон`}
        description={(doc.content_text || '').slice(0, 155)}
        path={docPath}
        type="article"
        jsonLd={[legalDocJsonLd]}
        breadcrumbs={[
          { name: 'Главная', path: '/' },
          { name: typeLabel, path: '/codex' },
          { name: doc.short_title || doc.title, path: docPath },
        ]}
      />

      {/* Search panel */}
      {showSearch && (
        <DocumentSearchPanel
          matches={searchMatches}
          currentIndex={searchIndex}
          onSearch={handleSearch}
          onNavigate={handleSearchNavigate}
          onClose={() => { setShowSearch(false); setSearchQuery(''); setSearchMatches([]); }}
        />
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: typeLabel || 'Документы', href: '/documents' },
        { label: doc.short_title || doc.title },
      ]} />

      {/* Document header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] md:text-xs font-semibold ${TYPE_CLS[typeSlug] || 'bg-muted text-muted-foreground'}`}>
            {typeLabel}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] md:text-xs font-semibold ${statusInfo.cls}`}>
            ● {statusInfo.label}
          </span>
        </div>

        <h1 className="text-lg md:text-3xl font-bold leading-snug mb-2 md:mb-3">{doc.title}</h1>

        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
          {doc.doc_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />Принят: {formatDate(doc.doc_date)}</span>}
          {doc.doc_number && <span>№ {doc.doc_number}</span>}
          {ib && <span className="hidden md:inline">{ib.name_ru}</span>}
          {doc.source_url && (
            <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5" />Источник
            </a>
          )}
        </div>

        {/* Action buttons — desktop */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <Download className="h-4 w-4" />PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>Доступно на тарифе Профи</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />Поделиться
          </Button>
          <Button variant={isBookmarked ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={toggleBookmark}>
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />Избранное
          </Button>
          <Button variant={isSubscribed ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={toggleSubscription}>
            <Bell className={`h-4 w-4 ${isSubscribed ? 'fill-current' : ''}`} />Следить
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4" />Поиск
          </Button>
        </div>

        {/* Action buttons — mobile: search + dropdown */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant={isBookmarked ? 'default' : 'outline'} size="icon" className="h-9 w-9 shrink-0" onClick={toggleBookmark}>
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />Поделиться
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleSubscription}>
                <Bell className="h-4 w-4 mr-2" />{isSubscribed ? 'Отписаться' : 'Следить'}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="h-4 w-4 mr-2" />PDF (Профи)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile TOC button — full width */}
        {tocSections.length > 0 && (
          <Sheet open={tocOpen} onOpenChange={setTocOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden w-full flex items-center justify-between border rounded-lg px-4 py-3 text-sm font-medium mt-3 bg-background hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Menu className="h-4 w-4 text-muted-foreground" />
                  Содержание{focusedSections?.[0] ? ` · ${focusedSections[0].number || focusedSections[0].title || ''}` : ''}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <DocumentTOCPanel
                sections={tocSections}
                activeId={focusedId}
                onSelect={handleSelectSection}
                mode={viewMode}
                freeLimit={freeLimit}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Three-column layout */}
      <div className="flex gap-6 md:flex-1 md:min-h-0">
        {/* LEFT: TOC */}
        {!isMobile && tocSections.length > 0 && (
          <aside className="hidden md:block w-[280px] shrink-0 overflow-y-auto doc-scroll border-r border-border pr-4">
              <DocumentTOCPanel
                sections={tocSections}
                activeId={focusedId}
                onSelect={handleSelectSection}
                mode={viewMode}
                freeLimit={freeLimit}
              />
          </aside>
        )}

        {/* CENTER: Document body */}
        <div className="flex-1 min-w-0 max-w-[820px] mx-auto overflow-visible md:overflow-y-auto doc-scroll">
          {/* Mode switcher */}
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

          {/* Focused section badge */}
          {viewMode === 'focus' && focusedSections && focusedSections[0] && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="font-normal text-xs">
                {focusedSections[0].number ? `${focusedSections[0].number} ` : ''}{focusedSections[0].title || ''}
              </Badge>
            </div>
          )}

          {/* Content */}
          {sections.length > 0 ? (
            <Card className="border rounded-xl">
              <CardContent className="p-6 md:p-8 font-serif leading-relaxed" ref={contentRef}>
                <div className="max-w-none">
                  {displaySections.map((section, idx) => {
                    // Use global index for gating, not display index
                    const globalIdx = sections.findIndex(s => s.id === section.id);
                    return (
                      <ContentGate
                        key={section.id}
                        sectionIndex={globalIdx >= 0 ? globalIdx : idx}
                        sectionTitle={section.title}
                        sectionNumber={section.number}
                        documentTitle={doc.title}
                        totalSections={sections.length}
                        userPlan={userProfile?.subscription_plan}
                        renderContent={() => (
                          <DocumentArticleRenderer
                            id={section.id}
                            title={section.title}
                            number={section.number}
                            content={section.content}
                            level={section.level}
                            searchQuery={searchQuery}
                            onArticleClick={handleArticleRefClick}
                            onAIExplain={handleAIExplain}
                          />
                        )}
                      />
                    );
                  })}
                </div>

                {/* Article navigation (focus mode) */}
                {viewMode === 'focus' && articleIds.length > 0 && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={currentArticleIndex <= 0}
                      onClick={() => goToArticle('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Предыдущая
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentArticleIndex >= 0 ? `${currentArticleIndex + 1} из ${articleIds.length}` : ''}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={currentArticleIndex >= articleIds.length - 1}
                      onClick={() => goToArticle('next')}
                    >
                      Следующая
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Removed old gate — ContentGate handles it per-section */}
              </CardContent>
            </Card>
          ) : doc.content_markdown ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Текст документа обрабатывается...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Текст документа пока не загружен.</p>
              </CardContent>
            </Card>
          )}

          {/* Freshness disclaimer */}
          <DocumentFreshness lastUpdated={doc.last_updated} sourceUrl={doc.source_url} />
        </div>

        {/* RIGHT: Sidebar */}
        {!isMobile && (
          <aside className="hidden lg:block w-[280px] shrink-0 overflow-y-auto doc-scroll space-y-4">
            <div className="space-y-4">
              {/* Related documents */}
              {relations && relations.length > 0 && (
              <Card className="rounded-xl shadow-sm">
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
                        <Link
                          key={rel.id}
                          to={`/documents/${linked.id}`}
                          className="block text-xs hover:text-primary transition-colors"
                        >
                          <Badge variant="outline" className="text-[10px] mb-0.5">
                            {RELATION_LABELS[rel.relation_type] || rel.relation_type}
                          </Badge>
                          <p className="line-clamp-2">{linked.short_title || linked.title}</p>
                          {linked.doc_date && <span className="text-muted-foreground">{formatDate(linked.doc_date)}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Amendment history */}
              <DocumentAmendments documentId={id!} onArticleClick={handleArticleRefClick} />

              {/* AI assistant block */}
              <div className="border rounded-xl p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Есть вопрос по документу?</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Задайте вопрос и получите ответ со ссылками на статьи
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
                >
                  Задать вопрос
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile: right sidebar content below */}
      {isMobile && (
        <div className="mt-6 space-y-4">
          <DocumentAmendments documentId={id!} onArticleClick={handleArticleRefClick} />
          {relations && relations.length > 0 && (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Связанные документы</h3>
                <div className="space-y-2">
                  {relations.slice(0, 5).map((rel: any) => {
                    const isSource = rel.source_document_id === id;
                    const linked = isSource ? rel.target : rel.source;
                    if (!linked) return null;
                    return (
                      <Link key={rel.id} to={`/documents/${linked.id}`} className="block text-xs hover:text-primary">
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