import { AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AIChat() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Ассистент</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Задайте вопрос по законодательству Республики Беларусь
        </p>
      </div>

      <Alert variant="destructive" className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground text-sm">
          <strong>Внимание:</strong> Платформа не предоставляет юридических
          консультаций. Ответы AI носят информационный характер и могут
          содержать неточности. Всегда проверяйте информацию по первоисточникам.
        </AlertDescription>
      </Alert>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Чат</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <p className="text-sm text-muted-foreground text-center py-12">
            Начните диалог — введите ваш вопрос ниже.
          </p>

          <div className="flex gap-2">
            <Input placeholder="Введите вопрос..." disabled />
            <Button disabled>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
