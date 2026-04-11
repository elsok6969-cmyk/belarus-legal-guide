import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageSEO } from '@/components/shared/PageSEO';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineEmailForm } from '@/components/paywall/InlineEmailForm';
import { DocumentArticleRenderer } from '@/components/document/DocumentArticleRenderer';
import { ChevronLeft, ChevronRight, BookOpen, MessageSquare, FileText } from 'lucide-react';

export default function CodexArticle() {
  const { codexSlug, number } = useParams<{ codexSlug: string; number: string }>();
  const artNum = number?.replace(/^statya-?/, '') || number || '';

  const { data: codexDoc, isLoading: docLoading } = useQuery({
    queryKey: ['codex-lookup', codexSlug],
    queryFn: async () => {
      // Direct slug lookup
      const { data } = await supabase
        .from('documents')
        .select('id, title, short_title, slug, doc_date, source_url')
        .eq('slug', codexSlug!)
        .maybeSingle();
      return data;
    },
    enabled: !!codexSlug,
    staleTime: 3600000,
  });

  const { data: section, isLoading: secLoading } = useQuery({
    queryKey: ['codex-article', codexDoc?.id, artNum],
    queryFn: async () => {
      if (!codexDoc?.id) return null;
      const { data } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', codexDoc.id)
        .or(`number.ilike.%Статья ${artNum}%,number.ilike.%Статья ${artNum}.%,number.eq.${artNum}`)
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!codexDoc?.id && !!artNum,
    staleTime: 3600000,
  });

  const { data: neighbors } = useQuery({
    queryKey: ['codex-neighbors', codexDoc?.id, section?.sort_order],
    queryFn: async () => {
      if (!codexDoc?.id || section?.sort_order === undefined) return { prev: null, next: null };
      const [{ data: prevData }, { data: nextData }] = await Promise.all([
        supabase.from('document_sections')
          .select('number, title, sort_order')
          .eq('document_id', codexDoc.id)
          .eq('section_type', 'article')
          .lt('sort_order', section.sort_order)
          .order('sort_order', { ascending: false })
          .limit(1),
        supabase.from('document_sections')
          .select('number, title, sort_order')
          .eq('document_id', codexDoc.id)
          .eq('section_type', 'article')
          .gt('sort_order', section.sort_order)
          .order('sort_order', { ascending: true })
          .limit(1),
      ]);
      return { prev: prevData?.[0] || null, next: nextData?.[0] || null };
    },
    enabled: !!codexDoc?.id && section?.sort_order !== undefined,
    staleTime: 3600000,
  });

  const isLoading = docLoading || secLoading;
  const codexTitle = codexDoc?.short_title || codexDoc?.title || 'Кодекс';
  const articleTitle = section?.title || `Статья ${artNum}`;
  const content = section?.content_markdown || section?.content_text || '';
  const descText = (section?.content_text || '').slice(0, 155);

  const getArtNumber = (num: string | null) => {
    if (!num) return '';
    const m = num.match(/\d+/);
    return m ? m[0] : num;
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!section || !codexDoc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Статья не найдена</h1>
        <p className="text-muted-foreground mb-4">
          Статья {artNum} не найдена в «{codexSlug}»
        </p>
        <Button asChild variant="outline">
          <Link to={codexDoc ? `/documents/${codexDoc.slug || codexDoc.id}` : '/codex'}>
            {codexDoc ? `Открыть ${codexTitle}` : 'К списку кодексов'}
          </Link>
        </Button>
      </div>
    );
  }

  const pagePath = `/codex/${codexSlug}/statya-${artNum}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: `Статья ${artNum} ${codexDoc.title}`,
    isPartOf: { '@type': 'Legislation', name: codexDoc.title },
    inLanguage: 'ru',
    legislationJurisdiction: 'BY',
    url: `https://babijon.by${pagePath}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageSEO
        title={`Статья ${artNum}. ${section.title || ''} — ${codexTitle} | Бабиджон`}
        description={descText || `${articleTitle} ${codexTitle} Республики Беларусь. Полный текст статьи в актуальной редакции.`}
        path={pagePath}
        type="article"
        jsonLd={[articleJsonLd]}
        breadcrumbs={[
          { name: 'Главная', path: '/' },
          { name: 'Кодексы', path: '/codex' },
          { name: codexTitle, path: `/documents/${codexDoc.slug || codexDoc.id}` },
          { name: `Статья ${artNum}`, path: pagePath },
        ]}
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Кодексы', href: '/codex' },
        { label: codexTitle, href: `/documents/${codexDoc.slug || codexDoc.id}` },
        { label: articleTitle },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">{codexDoc.title}</p>
        <h1 className="text-xl md:text-2xl font-bold leading-snug">{articleTitle}</h1>
      </div>

      {/* Article content — fully free, no paywall */}
      <Card className="rounded-xl shadow-sm mb-6">
        <CardContent className="p-6 md:p-8 prose prose-sm max-w-none dark:prose-invert">
          <DocumentArticleRenderer
            id={section.id}
            title={null}
            number={null}
            content={content}
            level={section.level}
            searchQuery=""
            onArticleClick={() => {}}
            onAIExplain={() => {}}
          />
        </CardContent>
      </Card>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between mb-6">
        {neighbors?.prev ? (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/codex/${codexSlug}/statya-${getArtNumber(neighbors.prev.number)}`}>
              <ChevronLeft className="h-4 w-4" />
              Статья {getArtNumber(neighbors.prev.number)}
            </Link>
          </Button>
        ) : <div />}
        {neighbors?.next ? (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/codex/${codexSlug}/statya-${getArtNumber(neighbors.next.number)}`}>
              Статья {getArtNumber(neighbors.next.number)}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : <div />}
      </div>

      {/* Read full codex */}
      <Card className="rounded-xl border-primary/20 mb-6">
        <CardContent className="p-5 flex items-center gap-4">
          <BookOpen className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Читать весь {codexTitle}</p>
            <p className="text-xs text-muted-foreground">Полное оглавление и все статьи</p>
          </div>
          <Button asChild size="sm">
            <Link to={`/documents/${codexDoc.slug || codexDoc.id}`}>Открыть</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Subscription CTA */}
      <div className="border rounded-xl p-6 bg-muted/30 text-center mt-8 mb-6">
        <p className="font-semibold text-base mb-1">Полный доступ ко всем документам</p>
        <p className="text-sm text-muted-foreground mb-4">Персональный — 69 BYN/мес</p>
        <Button asChild>
          <Link to="/pricing">Оформить подписку</Link>
        </Button>
      </div>

      {/* AI CTA */}
      <Card className="rounded-xl mb-6">
        <CardContent className="p-5 flex items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Задать вопрос по этой статье</p>
            <p className="text-xs text-muted-foreground">AI-помощник объяснит простым языком</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ai-assistant">Спросить AI</Link>
          </Button>
        </CardContent>
      </Card>

      <InlineEmailForm
        source="codex_article"
        title="Следите за изменениями"
        description={`Получайте уведомления об изменениях в ${codexTitle}`}
      />

      {codexDoc.source_url && (
        <p className="text-xs text-muted-foreground mt-6">
          Источник:{' '}
          <a href={codexDoc.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            pravo.by
          </a>
        </p>
      )}
    </div>
  );
}
