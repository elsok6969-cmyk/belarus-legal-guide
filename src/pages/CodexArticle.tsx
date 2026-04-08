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

const CODEX_MAP: Record<string, string> = {};

export default function CodexArticle() {
  const { codexSlug, number } = useParams<{ codexSlug: string; number: string }>();
  const artNum = number?.replace(/^statya-?/, '') || number || '';

  // Find the document by matching slug pattern in short_title or metadata
  const { data: codexDoc, isLoading: docLoading } = useQuery({
    queryKey: ['codex-lookup', codexSlug],
    queryFn: async () => {
      // Try matching by short_title slug pattern
      const { data } = await supabase
        .from('documents')
        .select('id, title, short_title, doc_date, source_url, document_types!inner(slug)')
        .eq('document_types.slug', 'codex')
        .limit(100);
      
      if (!data) return null;
      
      // Find by slug matching
      const slugLower = (codexSlug || '').toLowerCase();
      const match = data.find(d => {
        const st = (d.short_title || '').toLowerCase().replace(/[^a-zа-яё0-9]/g, '-').replace(/-+/g, '-');
        const t = (d.title || '').toLowerCase();
        return st.includes(slugLower) || slugLower.includes(st.replace(/-/g, '')) ||
          t.includes(slugLower.replace(/-/g, ' '));
      });
      return match || data[0] || null;
    },
    enabled: !!codexSlug,
    staleTime: 3600000,
  });

  // Fetch the specific section/article
  const { data: section, isLoading: secLoading } = useQuery({
    queryKey: ['codex-article', codexDoc?.id, artNum],
    queryFn: async () => {
      if (!codexDoc?.id) return null;
      const { data } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', codexDoc.id)
        .or(`number.eq.${artNum},number.eq.Статья ${artNum}`)
        .limit(1);
      
      if (data && data.length > 0) return data[0];
      
      // Fallback: search by title pattern
      const { data: byTitle } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', codexDoc.id)
        .ilike('title', `%Статья ${artNum}%`)
        .limit(1);
      
      return byTitle?.[0] || null;
    },
    enabled: !!codexDoc?.id && !!artNum,
    staleTime: 3600000,
  });

  // Get prev/next articles
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

      return {
        prev: prevData?.[0] || null,
        next: nextData?.[0] || null,
      };
    },
    enabled: !!codexDoc?.id && section?.sort_order !== undefined,
    staleTime: 3600000,
  });

  const isLoading = docLoading || secLoading;
  const codexTitle = codexDoc?.short_title || codexDoc?.title || 'Кодекс';
  const articleTitle = section?.title || `Статья ${artNum}`;

  const getArtNumber = (num: string | null) => {
    if (!num) return '';
    const m = num.match(/\d+/);
    return m ? m[0] : num;
  };

  const articleJsonLd = section ? {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: `${articleTitle} — ${codexTitle}`,
    isPartOf: { '@type': 'Legislation', name: codexTitle },
    inLanguage: 'ru',
    url: `/codex/${codexSlug}/statya-${artNum}`,
  } : undefined;

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
        <h1 className="text-2xl font-bold mb-2">Статья не найдена</h1>
        <p className="text-muted-foreground mb-4">
          Статья {artNum} не найдена в кодексе «{codexSlug}»
        </p>
        <Button asChild variant="outline">
          <Link to="/documents">К списку документов</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageSEO
        title={`${articleTitle} ${codexTitle} — полный текст | Бабиджон`}
        description={`${articleTitle} ${codexTitle} Республики Беларусь. Полный текст статьи в актуальной редакции.`}
        path={`/codex/${codexSlug}/statya-${artNum}`}
        type="article"
        jsonLd={articleJsonLd ? [articleJsonLd] : undefined}
      />

      <Breadcrumbs items={[
        { label: 'Главная', href: '/' },
        { label: 'Кодексы', href: '/documents?filter=codex' },
        { label: codexTitle, href: `/documents/${codexDoc.id}` },
        { label: articleTitle },
      ]} />

      {/* Article header */}
      <div className="mb-6">
        <Badge variant="secondary" className="mb-2">
          {codexTitle}
        </Badge>
        <h1 className="text-2xl font-bold leading-snug">{articleTitle}</h1>
      </div>

      {/* Article content — always fully free */}
      <Card className="rounded-xl shadow-sm mb-6">
        <CardContent className="p-6 md:p-8">
          <DocumentArticleRenderer
            id={section.id}
            title={null}
            number={null}
            content={section.content_markdown || section.content_text || ''}
            level={section.level}
            searchQuery=""
            onArticleClick={() => {}}
            onAIExplain={() => {}}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        {neighbors?.prev ? (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/codex/${codexSlug}/statya-${getArtNumber(neighbors.prev.number)}`}>
              <ChevronLeft className="h-4 w-4" />
              Ст. {getArtNumber(neighbors.prev.number)}
            </Link>
          </Button>
        ) : <div />}
        {neighbors?.next ? (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to={`/codex/${codexSlug}/statya-${getArtNumber(neighbors.next.number)}`}>
              Ст. {getArtNumber(neighbors.next.number)}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : <div />}
      </div>

      {/* CTA: Read full codex */}
      <Card className="rounded-xl border-primary/20 mb-6">
        <CardContent className="p-5 flex items-center gap-4">
          <BookOpen className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Читать весь {codexTitle}</p>
            <p className="text-xs text-muted-foreground">Полное оглавление и все статьи</p>
          </div>
          <Button asChild size="sm">
            <Link to={`/documents/${codexDoc.id}`}>Открыть</Link>
          </Button>
        </CardContent>
      </Card>

      {/* AI assistant CTA */}
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

      {/* Email form */}
      <InlineEmailForm
        source="codex_article"
        title="Следите за изменениями"
        description={`Получайте уведомления об изменениях в ${codexTitle}`}
      />

      {/* Source */}
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
