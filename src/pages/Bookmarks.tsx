import { Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Bookmarks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Закладки</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сохранённые документы</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            У вас пока нет сохранённых документов. Добавляйте закладки при просмотре документов.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
