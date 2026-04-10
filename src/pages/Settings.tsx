import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, User, Palette, Bell, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Профиль обновлён');
    },
    onError: () => toast.error('Ошибка при сохранении'),
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (settings) {
        const { error } = await supabase
          .from('user_settings')
          .update(updates)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({ user_id: user!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Настройки сохранены');
    },
    onError: () => toast.error('Ошибка при сохранении'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Настройки</h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <Label>Отображаемое имя</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите имя..."
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending || displayName === profile?.display_name}
          >
            Сохранить
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Предпочтения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Аудитория контента</Label>
            <Select
              value={settings?.audience || 'general'}
              onValueChange={(v) => upsertSettings.mutate({ audience: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Общая</SelectItem>
                <SelectItem value="accountant">Бухгалтер</SelectItem>
                <SelectItem value="lawyer">Юрист</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Влияет на рекомендации, дедлайны и фильтрацию контента
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Частота обновлений</Label>
            <Select
              value={settings?.update_frequency || 'weekly'}
              onValueChange={(v) => upsertSettings.mutate({ update_frequency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Ежедневно</SelectItem>
                <SelectItem value="weekly">Еженедельно</SelectItem>
                <SelectItem value="monthly">Ежемесячно</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Уведомления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email-уведомления</p>
              <p className="text-xs text-muted-foreground">
                Получать письма об изменениях в отслеживаемых документах
              </p>
            </div>
            <Switch
              checked={settings?.email_notifications ?? true}
              onCheckedChange={(v) => upsertSettings.mutate({ email_notifications: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
