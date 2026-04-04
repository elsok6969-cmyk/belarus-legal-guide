import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Просмотр документа</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Документ #{id || '—'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Содержимое документа будет загружено из базы данных. Пока это
            заглушка.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
