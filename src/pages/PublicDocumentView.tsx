import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock, ExternalLink, Lock } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const docTypeLabel = (t: string) => {
  const map: Record<string, string> = { law: 'Закон', codex: 'Кодекс', decree: 'Указ', resolution: 'Постановление', order: 'Приказ' };
  return map[t] || t;
};

export default function PublicDocumentView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: doc, isLoading } = useQuery({
    queryKey: ['public-doc', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Документ не найден</h1>
        <Link to="/documents" className="text-primary hover:underline">← К списку документов</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO title={`${doc.title} — Право БY`} description={doc.summary || doc.title} path={`/documents/${doc.id}`} />

      <Link to="/documents" className="text-sm text-primary hover:underline mb-4 inline-block">← Все документы</Link>

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
          {docTypeLabel(doc.doc_type)}
        </span>
        {doc.doc_number && <span className="text-sm text-muted-foreground">№ {doc.doc_number}</span>}
        {doc.status === 'active' && <span className="text-xs text-primary font-medium">Действует</span>}
      </div>

      <h1 className="text-xl md:text-2xl font-bold leading-snug mb-4">{doc.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
        {doc.date_adopted && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Принят: {format(new Date(doc.date_adopted), 'dd.MM.yyyy')}
          </span>
        )}
        {doc.date_effective && (
          <span>Вступил в силу: {format(new Date(doc.date_effective), 'dd.MM.yyyy')}</span>
        )}
        {doc.source_url && (
          <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Источник
          </a>
        )}
      </div>

      {doc.summary && (
        <Card className="mb-6 border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-2">Краткое содержание</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{doc.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Body text — freemium gate */}
      {doc.body_text ? (
        user ? (
          <Card className="border">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-3">Текст документа</h2>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {doc.body_text}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Полный текст доступен после регистрации</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Зарегистрируйтесь бесплатно, чтобы читать полные тексты документов, использовать AI-ассистент и сохранять закладки.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/register">Зарегистрироваться бесплатно</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/login">Войти</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <p className="text-sm text-muted-foreground italic">Полный текст документа пока не загружен.</p>
      )}
    </div>
  );
}
