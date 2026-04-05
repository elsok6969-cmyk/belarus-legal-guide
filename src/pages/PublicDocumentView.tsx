import { useQuery, useMutation } from '@tanstack/react-query';
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

const docTypeLabel: Record<string, string> = {
  law: 'Закон', codex: 'Кодекс', decree: 'Указ', decret: 'Декрет',
  resolution: 'Постановление', order: 'Приказ',
};
const docTypeBadgeClass: Record<string, string> = {
  codex: 'bg-primary/15 text-primary',
  law: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  decree: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  decret: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  resolution: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

interface TocItem { id: string; label: string; level: number }

function parseToc(text: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = text.split('\n');
  let articleIdx = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const chapterMatch = trimmed.match(/^(Глава\s+\d+)/i);
    const sectionMatch = trimmed.match(/^(Раздел\s+[IVXLC]+)/i);
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

function TableOfContents({ items, activeId, onClickItem }: { items: TocItem[]; activeId: string; onClickItem?: () => void }) {
  return (
    <nav className="space-y-0.5 text-sm">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState(null, '', `#${item.id}`);
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
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const [activeId, setActiveId] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Determine query mode
  const isSlugRoute = location.pathname.startsWith('/doc/');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['public-doc', slug || id],
    queryFn: async () => {
      const col = (isSlugRoute && slug) ? 'slug' : 'id';
      const val = (isSlugRoute && slug) ? slug : id!;
      const { data } = await (supabase.from('documents').select('*') as any).eq(col, val).single();
      return data;
    },
    enabled: !!(slug || id),
  });

  // Increment view count
  useEffect(() => {
    if (!doc?.id) return;
    supabase.rpc('increment_view_count', { doc_id: doc.id } as any).then();
  }, [doc?.id]);

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
    queryKey: ['related-docs', doc?.doc_type, doc?.id],
    queryFn: async () => {
      const { data } = await supabase.from('documents')
        .select('id, title, doc_type, date_adopted, slug' as any)
        .eq('doc_type', doc!.doc_type)
        .neq('id', doc!.id)
        .order('view_count' as any, { ascending: false })
        .limit(5);
      return data as any[] || [];
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
        .order('detected_at', { ascending: false });
      return data || [];
    },
    enabled: !!doc,
  });

  // Parse TOC & body
  const tocItems = useMemo(() => doc?.body_text ? parseToc(doc.body_text) : [], [doc?.body_text]);
  const formattedBody = useMemo(() => doc?.body_text ? formatBodyText(doc.body_text) : [], [doc?.body_text]);

  // Intersection Observer for active TOC item
  useEffect(() => {
    if (!tocItems.length) return;
    observerRef.current?.disconnect();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActiveId(e.target.id); break; }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    observerRef.current = obs;
    for (const item of tocItems) {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [tocItems, formattedBody]);

  // Determine access level
  const isFree = doc?.is_free === true;
  const hasFullAccess = isFree || !!user;

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

  /* ── Loading state ─── */
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

  const typeLabel = docTypeLabel[doc.doc_type] || doc.doc_type;
  const typeBadgeClass = docTypeBadgeClass[doc.doc_type] || 'bg-muted text-muted-foreground';

  const changeTypeLabel: Record<string, string> = { amended: 'Изменён', new_version: 'Новая редакция', repealed: 'Утратил силу' };

  const legalDocJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: doc.title,
    description: `Полный текст ${typeLabel} "${doc.title}"`,
    datePublished: doc.date_adopted,
    dateModified: doc.updated_at,
    publisher: doc.organ ? { '@type': 'Organization', name: doc.organ } : undefined,
    inLanguage: 'ru',
    legislationIdentifier: doc.reg_number || doc.doc_number,
    url: `https://pravoby.by/doc/${doc.slug || doc.id}`,
    legislationLegalForce: doc.status === 'active' ? 'InForce' : 'NotInForce',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://pravoby.by' },
      { '@type': 'ListItem', position: 2, name: 'Документы', item: 'https://pravoby.by/documents' },
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
        description={`Читайте полный текст ${typeLabel} "${doc.title}"${doc.date_adopted ? ` от ${formatDateShort(doc.date_adopted)}` : ''}. Актуальная редакция.`}
        path={`/doc/${doc.slug || doc.id}`}
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
            ) : doc.status === 'repealed' ? (
              <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400 text-xs">● Утратил силу</Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 text-xs">● Изменён</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug mb-3">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {doc.date_adopted && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Принят: {format(new Date(doc.date_adopted), 'dd.MM.yyyy')}</span>}
            {(doc as any).reg_number && <span>№ {(doc as any).reg_number}{(doc as any).reg_date ? ` от ${format(new Date((doc as any).reg_date), 'dd.MM.yyyy')}` : ''}</span>}
            {(doc as any).organ && <span>Орган: {(doc as any).organ}</span>}
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

      {/* Summary */}
      {doc.summary && (
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-2">Краткое содержание</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{doc.summary}</p>
          </CardContent>
        </Card>
      )}

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
                <TableOfContents items={tocItems} activeId={activeId} />
              </div>
            </div>
          </aside>
        )}

        {/* Center: Document body */}
        <div className="flex-1 min-w-0">
          {doc.body_text ? (
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
                    {/* Blurred preview of remaining text */}
                    <div className="blur-sm select-none pointer-events-none" style={{ minHeight: 300 }}>
                      {formattedBody.slice(thirdArticleIndex, thirdArticleIndex + 15).map((s) => (
                        <p key={s.id} className="text-sm leading-relaxed mb-3">{s.text}</p>
                      ))}
                    </div>
                    {/* CTA overlay */}
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
                      <span className="text-muted-foreground w-24 shrink-0">{format(new Date(v.detected_at), 'dd.MM.yyyy')}</span>
                      <Badge variant="outline" className="text-xs">{changeTypeLabel[v.change_type] || v.change_type}</Badge>
                      <span className="text-muted-foreground">{v.summary || `Версия ${v.version_number}`}</span>
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
          {docs.map((d: any) => (
            <Link
              key={d.id}
              to={d.slug ? `/doc/${d.slug}` : `/documents/${d.id}`}
              className="block text-sm hover:text-primary transition-colors"
            >
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${docTypeBadgeClass[d.doc_type] || 'bg-muted text-muted-foreground'}`}>
                {docTypeLabel[d.doc_type] || d.doc_type}
              </span>
              <span className="leading-snug">{d.title}</span>
              {d.date_adopted && <span className="block text-xs text-muted-foreground mt-0.5">{format(new Date(d.date_adopted), 'dd.MM.yyyy')}</span>}
            </Link>
          ))}
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
