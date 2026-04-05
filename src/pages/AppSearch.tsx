import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppSearch() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Поиск по законодательству</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Введите запрос..." className="pl-9" disabled />
        </div>
        <Button variant="outline" disabled>
          <Filter className="mr-2 h-4 w-4" />
          Фильтры
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Результаты поиска</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Введите запрос для поиска по базе законодательства Республики Беларусь.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
