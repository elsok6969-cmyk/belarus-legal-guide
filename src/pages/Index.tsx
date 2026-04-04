import { FileText, Search, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Добро пожаловать{user?.email ? `, ${user.email}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Платформа правовой информации Республики Беларусь
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Быстрый полнотекстовый поиск по базе нормативных правовых актов.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Документы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Просмотр и навигация по структурированным правовым документам.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Ассистент</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Задайте вопрос — получите ответ со ссылками на источники.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последние документы</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Здесь будут отображаться недавно просмотренные документы.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
