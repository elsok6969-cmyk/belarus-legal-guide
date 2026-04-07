import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Clock, Download, Share2, Bookmark, Bell, Lock,
  ChevronRight, BookOpen, ExternalLink, Mail, ListTree,
} from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* ── helpers ────────────────────────────────────────── */

const docTypeBadgeClass: Record<string, string> = {
  codex: 'bg-primary/15 text-primary',
  law: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  decree: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  resolution: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

interface TocItem { id: string; label: string; level: number }

function parseToc(text: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = text.split('\n');
  let articleIdx = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const sectionMatch = trimmed.match(/^(Раздел\s+[IVXLC]+)/i);
    const chapterMatch = trimmed.match(/^(Глава\s+\d+)/i);
    const articleMatch = trimmed.match(/^(Статья\s+\d+)/i);
    if (sectionMatch) {
      items.push({ id: `section-${items.length}`, label: trimmed.slice(0, 80), level: 0 });
    } else if (chapterMatch) {
      items.push({ id: `chapter-${items.length}`, label: trimmed.slice(0, 80), level: 1 });
    } else if (articleMatch) {
      articleIdx++;
      items.push({ id: `article-${articleIdx}`, label: trimmed.slice(0, 80), level: 2 });
    }
  }
  return items;
}

interface FormattedSection { id: string; type: 'section' | 'chapter' | 'article' | 'paragraph'; text: string }

function formatBodyText(text: string): FormattedSection[] {
  const sections: FormattedSection[] = [];
  const lines = text.split('\n');
  let articleIdx = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^Раздел\s+[IVXLC]+/i.test(t)) {
      sections.push({ id: `section-${sections.length}`, type: 'section', text: t });
    } else if (/^Глава\s+\d+/i.test(t)) {
      sections.push({ id: `chapter-${sections.length}`, type: 'chapter', text: t });
    } else if (/^Статья\s+\d+/i.test(t)) {
      articleIdx++;
      sections.push({ id: `article-${articleIdx}`, type: 'article', text: t });
    } else {
      sections.push({ id: `p-${sections.length}`, type: 'paragraph', text: t });
    }
  }
  return sections;
}

/* ── TOC component ──────────────────────────────────── */

function TableOfContents({ items, activeId, onClickItem, onFocusItem }: { items: TocItem[]; activeId: string; onClickItem?: () => void; onFocusItem?: (id: string) => void }) {
  return (
    <nav className="space-y-0.5 text-sm">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            window.history.replaceState(null, '', `#${item.id}`);
            onFocusItem?.(item.id);
            onClickItem?.();
          }}
          className={`block truncate py-1 transition-colors hover:text-primary ${
            item.level === 0 ? 'font-semibold' : item.level === 1 ? 'pl-3' : 'pl-6 text-muted-foreground'
          } ${activeId === item.id ? 'text-primary font-medium' : ''}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/* ── Main page ──────────────────────────────────────── */

export default function PublicDocumentView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['public-doc', id],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('*, document_types(slug, name_ru), issuing_bodies(name_ru)')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  // Bookmark & subscription state
  const { data: isBookmarked } = useQuery({
    queryKey: ['bookmark', doc?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user!.id).eq('document_id', doc!.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!doc,
  });

  const { data: isSubscribed } = useQuery({
    queryKey: ['subscription', doc?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('id').eq('user_id', user!.id).eq('document_id', doc!.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!doc,
  });

  const toggleBookmark = useCallback(async () => {
    if (!user || !doc) { toast.error('Войдите, чтобы добавить в избранное'); return; }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('document_id', doc.id);
      toast('Удалено из избранного');
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, document_id: doc.id });
      toast.success('Добавлено в избранное');
    }
  }, [user, doc, isBookmarked]);

  const toggleSubscription = useCallback(async () => {
    if (!user || !doc) { toast.error('Войдите, чтобы подписаться на изменения'); return; }
    if (isSubscribed) {
      await supabase.from('subscriptions').delete().eq('user_id', user.id).eq('document_id', doc.id);
      toast('Подписка отменена');
    } else {
      await supabase.from('subscriptions').insert({ user_id: user.id, document_id: doc.id });
      toast.success('Вы подписаны на изменения');
    }
  }, [user, doc, isSubscribed]);

  // Related documents
  const { data: relatedDocs } = useQuery({
    queryKey: ['related-docs', doc?.document_type_id, doc?.id],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_date, document_types(slug, name_ru)')
        .eq('document_type_id', doc!.document_type_id)
        .neq('id', doc!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!doc,
  });

  // Document versions (history)
  const { data: versions } = useQuery({
    queryKey: ['doc-versions', doc?.id],
    queryFn: async () => {
      const { data } = await supabase.from('document_versions')
        .select('*')
        .eq('document_id', doc!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!doc,
  });

  // Parse TOC & body from content_markdown
  const bodyText = doc?.content_markdown || '';
  const tocItems = useMemo(() => bodyText ? parseToc(bodyText) : [], [bodyText]);
  const formattedBody = useMemo(() => bodyText ? formatBodyText(bodyText) : [], [bodyText]);

  // Initialize focusedId from URL hash
  const location = useLocation();
  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (hash && tocItems.some(t => t.id === hash)) {
      setFocusedId(hash);
      setActiveId(hash);
    }
  }, [tocItems, location.hash]);

  // Compute focused (filtered) sections — show only the clicked section and its content
  const focusedSections = useMemo(() => {
    if (!focusedId) return null;
    const startIdx = formattedBody.findIndex(s => s.id === focusedId);
    if (startIdx === -1) return null;
    const startSection = formattedBody[startIdx];
    // Determine section level priority: section > chapter > article
    const levelPriority = { section: 0, chapter: 1, article: 2, paragraph: 3 };
    const startLevel = levelPriority[startSection.type] ?? 3;
    // Collect everything from startIdx until the next heading of same or higher level
    const result = [formattedBody[startIdx]];
    for (let i = startIdx + 1; i < formattedBody.length; i++) {
      const s = formattedBody[i];
      const sLevel = levelPriority[s.type] ?? 3;
      if (sLevel <= startLevel && s.type !== 'paragraph') break;
      result.push(s);
    }
    return result;
  }, [focusedId, formattedBody]);

  const handleFocusSection = useCallback((id: string) => {
    setFocusedId(id);
    setActiveId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowAll = useCallback(() => {
    setFocusedId(null);
  }, []);

  // Access level
  const hasFullAccess = !!user;

  // Find index of 3rd article for freemium gate
  const thirdArticleIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < formattedBody.length; i++) {
      if (formattedBody[i].type === 'article') { count++; if (count === 4) return i; }
    }
    return formattedBody.length;
  }, [formattedBody]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Ссылка скопирована');
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="flex gap-8"><Skeleton className="h-[600px] w-64 hidden md:block" /><Skeleton className="h-[600px] flex-1" /></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Документ не найден</h1>
        <Link to="/documents" className="text-primary hover:underline">← К списку документов</Link>
      </div>
    );
  }

  const dt = doc.document_types as any;
  const ib = doc.issuing_bodies as any;
  const typeLabel = dt?.name_ru || '';
  const typeSlug = dt?.slug || '';
  const typeBadgeClass = docTypeBadgeClass[typeSlug] || 'bg-muted text-muted-foreground';

  const legalDocJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: doc.title,
    description: `Полный текст ${typeLabel} "${doc.title}"`,
    datePublished: doc.doc_date,
    dateModified: doc.last_updated,
    publisher: ib ? { '@type': 'Organization', name: ib.name_ru } : undefined,
    inLanguage: 'ru',
    legislationIdentifier: doc.doc_number,
    url: `/documents/${doc.id}`,
    legislationLegalForce: doc.status === 'active' ? 'InForce' : 'NotInForce',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Документы', item: '/documents' },
      { '@type': 'ListItem', position: 3, name: typeLabel },
      { '@type': 'ListItem', position: 4, name: doc.title },
    ],
  };

  const formatDateShort = (d: string | null) => {
    if (!d) return '';
    try { return format(new Date(d), 'dd.MM.yyyy'); } catch { return d; }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageSEO
        title={`${doc.title} — полный текст`}
        description={`Читайте полный текст ${typeLabel} "${doc.title}"${doc.doc_date ? ` от ${formatDateShort(doc.doc_date)}` : ''}. Актуальная редакция.`}
        path={`/documents/${doc.id}`}
        type="article"
        jsonLd={[legalDocJsonLd, breadcrumbJsonLd]}
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Документы', href: '/documents' },
        { label: typeLabel },
        { label: doc.title },
      ]} />

      {/* Header + Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
              {typeLabel}
            </span>
            {doc.status === 'active' ? (
              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 text-xs">● Действующий</Badge>
            ) : doc.status === 'cancelled' ? (
              <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400 text-xs">● Отменён</Badge>
            ) : doc.status === 'expired' ? (
              <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400 text-xs">● Истёк</Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs">● Не вступил в силу</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug mb-3">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {doc.doc_date && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Принят: {format(new Date(doc.doc_date), 'dd.MM.yyyy')}</span>}
            {doc.doc_number && <span>№ {doc.doc_number}</span>}
            {ib && <span>Орган: {ib.name_ru}</span>}
            {doc.source_url && (
              <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />Источник
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Доступно на тарифе Профи</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Поделиться</span>
          </Button>
          <Button
            variant={isBookmarked ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={toggleBookmark}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Избранное</span>
          </Button>
          <Button
            variant={isSubscribed ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={toggleSubscription}
          >
            <Bell className={`h-4 w-4 ${isSubscribed ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Следить</span>
          </Button>
        </div>
      </div>

      {/* Main content: TOC + Body + Sidebar */}
      <div className="flex gap-6">
        {/* Left: TOC (desktop) */}
        {tocItems.length > 0 && (
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-20">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <ListTree className="h-4 w-4" />Содержание
              </h3>
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                <TableOfContents items={tocItems} activeId={activeId} onFocusItem={handleFocusSection} />
              </div>
            </div>
          </aside>
        )}

        {/* Center: Document body */}
        <div className="flex-1 min-w-0">
          {bodyText ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-6 relative">
                <h2 className="text-sm font-semibold mb-4">Текст документа</h2>
                <div className="space-y-0">
                  {formattedBody.slice(0, hasFullAccess ? undefined : thirdArticleIndex).map((s) => {
                    switch (s.type) {
                      case 'section':
                        return <h3 key={s.id} id={s.id} className="text-lg font-semibold mt-8 mb-4 scroll-mt-24">{s.text}</h3>;
                      case 'chapter':
                        return <h4 key={s.id} id={s.id} className="text-base font-semibold mt-6 mb-3 scroll-mt-24">{s.text}</h4>;
                      case 'article':
                        return <h5 key={s.id} id={s.id} className="text-base font-medium mt-6 mb-2 text-primary scroll-mt-24">{s.text}</h5>;
                      default:
                        return <p key={s.id} className="text-sm leading-relaxed mb-3">{s.text}</p>;
                    }
                  })}
                </div>

                {/* Freemium gate overlay */}
                {!hasFullAccess && formattedBody.length > thirdArticleIndex && (
                  <div className="relative mt-0">
                    <div className="blur-sm select-none pointer-events-none" style={{ minHeight: 300 }}>
                      {formattedBody.slice(thirdArticleIndex, thirdArticleIndex + 15).map((s) => (
                        <p key={s.id} className="text-sm leading-relaxed mb-3">{s.text}</p>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/90 to-transparent">
                      <div className="text-center p-8">
                        <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Полный текст доступен после регистрации</h3>
                        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                          Зарегистрируйтесь бесплатно, чтобы читать полные тексты документов, использовать AI-ассистент и сохранять закладки.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button asChild><Link to="/register">Зарегистрироваться бесплатно</Link></Button>
                          <Button asChild variant="outline"><Link to="/login">Войти</Link></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Полный текст документа пока не загружен.</p>
              </CardContent>
            </Card>
          )}

          {/* Version history (collapsible) */}
          <Collapsible className="mt-6">
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />История изменений</span>
                  <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {versions && versions.length > 0 ? versions.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground w-24 shrink-0">{format(new Date(v.created_at), 'dd.MM.yyyy')}</span>
                      <span className="text-muted-foreground">{v.change_description || `Версия ${v.version_number}`}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Нет записей об изменениях.</p>
                  )}
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>

          {/* Mobile: related docs & comments below body */}
          <div className="lg:hidden mt-6 space-y-6">
            <RelatedDocsBlock docs={relatedDocs || []} />
            <ExpertCommentsBlock />
          </div>
        </div>

        {/* Right sidebar (desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-6">
          <RelatedDocsBlock docs={relatedDocs || []} />
          <ExpertCommentsBlock />
        </aside>
      </div>

      {/* Mobile FAB: table of contents */}
      {tocItems.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg gap-2">
                <BookOpen className="h-5 w-5" />Содержание
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Содержание</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto mt-4 pb-8">
                <TableOfContents items={tocItems} activeId={activeId} onClickItem={() => {}} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar blocks ─────────────────────────────────── */

function RelatedDocsBlock({ docs }: { docs: any[] }) {
  if (!docs.length) return null;
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Связанные документы</h3>
        <div className="space-y-2.5">
          {docs.map((d: any) => {
            const dt = d.document_types as any;
            const typeSlug = dt?.slug || '';
            return (
              <Link
                key={d.id}
                to={`/documents/${d.id}`}
                className="block text-sm hover:text-primary transition-colors"
              >
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${docTypeBadgeClass[typeSlug] || 'bg-muted text-muted-foreground'}`}>
                  {dt?.name_ru || ''}
                </span>
                <span className="leading-snug">{d.title}</span>
                {d.doc_date && <span className="block text-xs text-muted-foreground mt-0.5">{format(new Date(d.doc_date), 'dd.MM.yyyy')}</span>}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpertCommentsBlock() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-2">Экспертные комментарии</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Комментарии экспертов появятся в ближайшее время. Хотите получить уведомление?
        </p>
        <div className="flex gap-2">
          <Input placeholder="Ваш email" className="text-sm h-9" />
          <Button size="sm" className="gap-1 shrink-0"><Mail className="h-3.5 w-3.5" />Уведомить</Button>
        </div>
      </CardContent>
    </Card>
  );
}
