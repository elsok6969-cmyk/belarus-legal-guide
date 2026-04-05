import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Updates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Обновления</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Изменения в документах</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Подпишитесь на документы, чтобы получать уведомления об их изменениях.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
