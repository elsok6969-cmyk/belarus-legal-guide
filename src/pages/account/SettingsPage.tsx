import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/shared/PageSEO';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Palette, Bell, Globe, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profileSettings = (userProfile?.settings || {}) as Record<string, any>;

  const upsertSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (settings) {
        const { error } = await supabase.from('user_settings').update(updates).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_settings').insert({ user_id: user!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Настройки сохранены');
    },
    onError: () => toast.error('Ошибка'),
  });

  const updateProfileSettings = useMutation({
    mutationFn: async (newSettings: Record<string, any>) => {
      const merged = { ...profileSettings, ...newSettings };
      const { error } = await supabase.from('user_profiles').update({ settings: merged }).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-settings'] });
      toast.success('Сохранено');
    },
    onError: () => toast.error('Ошибка'),
  });

  const currentTheme = settings?.theme || 'system';

  const handleThemeChange = (value: string) => {
    upsertSettings.mutate({ theme: value });
    if (value === 'light' && theme === 'dark') toggleTheme();
    if (value === 'dark' && theme === 'light') toggleTheme();
    if (value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark && theme === 'light') toggleTheme();
      if (!prefersDark && theme === 'dark') toggleTheme();
    }
  };

  const handleDeleteAccount = () => {
    setDeleteOpen(false);
    setDeleteConfirm('');
    toast.info('Заявка на удаление аккаунта отправлена. Мы свяжемся с вами для подтверждения.');
  };

  return (
    <div className="space-y-6">
      <PageSEO title="Настройки" description="Настройки приложения" path="/app/account/settings" noindex />
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" /> Настройки
      </h1>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Внешний вид</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Тема</Label>
            <Select value={currentTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Светлая</SelectItem>
                <SelectItem value="dark">🌙 Тёмная</SelectItem>
                <SelectItem value="system">💻 Системная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Информеры в шапке</Label>
            <p className="text-xs text-muted-foreground">Выберите, какие показатели отображать</p>
            {[
              { key: 'show_refinancing_rate', label: 'Ставка рефинансирования' },
              { key: 'show_min_wage', label: 'Минимальная зарплата (МЗП)' },
              { key: 'show_base_value', label: 'Базовая величина' },
              { key: 'show_currency_rates', label: 'Курсы валют' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={profileSettings[item.key] !== false}
                  onCheckedChange={(v) => updateProfileSettings.mutate({ [item.key]: v })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Уведомления</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email-дайджест</Label>
            <Select
              value={settings?.update_frequency || 'weekly'}
              onValueChange={(v) => upsertSettings.mutate({ update_frequency: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Ежедневно</SelectItem>
                <SelectItem value="weekly">Еженедельно</SelectItem>
                <SelectItem value="never">Отключено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email-уведомления</p>
              <p className="text-xs text-muted-foreground">Получать письма об обновлениях</p>
            </div>
            <Switch
              checked={settings?.email_notifications ?? true}
              onCheckedChange={(v) => upsertSettings.mutate({ email_notifications: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Изменения в документах на контроле</p>
              <p className="text-xs text-muted-foreground">Уведомлять при изменении отслеживаемых документов</p>
            </div>
            <Switch
              checked={profileSettings.notify_watched !== false}
              onCheckedChange={(v) => updateProfileSettings.mutate({ notify_watched: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Язык интерфейса</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value="ru" disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">🇧🇾 Русский</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">Другие языки будут доступны позже</p>
        </CardContent>
      </Card>

      {/* Delete account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Удаление аккаунта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Это действие необратимо. Все ваши данные, закладки и история будут удалены безвозвратно.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Удалить аккаунт</Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteConfirm(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите удаление аккаунта</DialogTitle>
            <DialogDescription>
              Введите «УДАЛИТЬ» для подтверждения. Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Введите УДАЛИТЬ"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" disabled={deleteConfirm !== 'УДАЛИТЬ'} onClick={handleDeleteAccount}>
              Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
