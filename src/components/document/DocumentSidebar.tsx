import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, History, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const RELATION_LABELS: Record<string, string> = {
  amends: 'Изменяет',
  amended_by: 'Изменён',
  repeals: 'Отменяет',
  repealed_by: 'Отменён',
  references: 'Ссылается на',
  referenced_by: 'Упомянут в',
  supersedes: 'Заменяет',
  superseded_by: 'Заменён',
};

export function DocumentSidebar({ documentId }: { documentId: string }) {
  const { data: relations } = useQuery({
    queryKey: ['document-relations', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_relations')
        .select('*, source:documents!document_relations_source_document_id_fkey(id, title, short_title), target:documents!document_relations_target_document_id_fkey(id, title, short_title)')
        .or(`source_document_id.eq.${documentId},target_document_id.eq.${documentId}`);
      if (error) throw error;
      return data;
    },
    staleTime: 3600000,
  });

  const { data: versions } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 3600000,
  });

  return (
    <div className="space-y-4">
      {/* Related documents */}
      {relations && relations.length > 0 && (
      <Card>
        <CardHeader className="pb-2 p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Связанные документы
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {relations.map(rel => {
              const isSource = rel.source_document_id === documentId;
              const linked = isSource ? (rel.target as any) : (rel.source as any);
              if (!linked) return null;
              return (
                <Link
                  key={rel.id}
                  to={`/app/documents/${linked.id}`}
                  className="block text-xs hover:text-primary transition-colors"
                >
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

      {/* Versions */}
      {versions && versions.length > 0 && (
      <Card>
        <CardHeader className="pb-2 p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Изменения и редакции
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.id} className="text-xs">
                <p className="font-medium">Версия {v.version_number}</p>
                {v.effective_date && (
                  <p className="text-muted-foreground">
                    от {new Date(v.effective_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
                {v.change_description && (
                  <p className="text-muted-foreground line-clamp-2">{v.change_description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
