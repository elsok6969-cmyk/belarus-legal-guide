import { Settings as SettingsIcon, User, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Отображаемое имя</label>
            <Input placeholder="Введите имя..." disabled className="mt-1" />
          </div>
          <Button disabled>Сохранить</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Предпочтения</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Выбор аудитории (бухгалтер/юрист), тема оформления и настройки уведомлений — в разработке.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
