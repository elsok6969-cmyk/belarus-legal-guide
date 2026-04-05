import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, Bookmark, BookmarkCheck, ArrowLeft, ExternalLink, Bell, BellOff, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, string> = {
  active: 'Действующий',
  amended: 'Изменён',
  repealed: 'Утратил силу',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  amended: 'bg-amber-100 text-amber-800',
  repealed: 'bg-red-100 text-red-800',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  law: 'Закон',
  codex: 'Кодекс',
  decree: 'Декрет / Указ',
  resolution: 'Постановление',
};

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
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
      return data;
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/search">
            <ArrowLeft className="mr-1 h-4 w-4" /> Назад
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight leading-tight">{doc.title}</h1>
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <Badge variant="outline">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</Badge>
              {doc.doc_number && <span>№ {doc.doc_number}</span>}
              <Badge className={STATUS_COLORS[doc.status] || ''} variant="secondary">
                {STATUS_LABELS[doc.status] || doc.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
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
          {doc.source_url && (
            <Button asChild variant="outline" size="sm">
              <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Источник
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {doc.date_adopted && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Дата принятия</p>
                <p className="text-sm font-medium">{new Date(doc.date_adopted).toLocaleDateString('ru-RU')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {doc.date_effective && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Дата вступления в силу</p>
                <p className="text-sm font-medium">{new Date(doc.date_effective).toLocaleDateString('ru-RU')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Тип</p>
              <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {doc.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Краткое описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{doc.summary}</p>
          </CardContent>
        </Card>
      )}

      {sections && sections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Содержание документа</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {sections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-sm font-medium">
                    {section.heading || `Раздел ${section.sort_order}`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {doc.body_text && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Текст документа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {doc.body_text}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
