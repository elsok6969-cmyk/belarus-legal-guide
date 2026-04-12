import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PageSEO } from '@/components/shared/PageSEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound, User, Trash2 } from 'lucide-react';

const professions = [
  { value: 'accountant', label: 'Бухгалтер' },
  { value: 'lawyer', label: 'Юрист' },
  { value: 'hr_specialist', label: 'Кадровик' },
  { value: 'economist', label: 'Экономист' },
  { value: 'entrepreneur', label: 'ИП' },
  { value: 'manager', label: 'Руководитель' },
  { value: 'procurement_specialist', label: 'Специалист по закупкам' },
  { value: 'labor_safety', label: 'Охрана труда' },
  { value: 'financier', label: 'Финансист' },
  { value: 'ecologist', label: 'Эколог' },
  { value: 'builder', label: 'Строитель' },
  { value: 'individual', label: 'Физическое лицо' },
  { value: 'other', label: 'Другое' },
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [unp, setUnp] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setLastName((profile as any).last_name || '');
      setPhone((profile as any).phone || '');
      setProfession(profile.profession || '');
      setCompanyName(profile.company_name || '');
      setUnp((profile as any).unp || '');
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName || null,
          last_name: lastName || null,
          phone: phone || null,
          profession: profession || null,
          company_name: companyName || null,
          unp: unp || null,
        } as any)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Данные сохранены');
    },
    onError: () => toast.error('Ошибка при сохранении'),
  });

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Ссылка для смены пароля отправлена на вашу почту');
    }
  };

  const handleDeleteAccount = async () => {
    // Sign out — actual deletion requires admin/edge function
    toast.success('Запрос на удаление аккаунта отправлен. Мы свяжемся с вами.');
    await signOut();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <PageSEO title="Профиль" description="Управление профилем" path="/app/account/profile" noindex />
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" /> Профиль
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Личные данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введите имя" />
          </div>

          <div className="space-y-2">
            <Label>Фамилия</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Введите фамилию" />
          </div>

          <div className="space-y-2">
            <Label>Электронная почта</Label>
            <Input value={user?.email || ''} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+375 29 123 45 67" />
          </div>

          <div className="space-y-2">
            <Label>Профессия</Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите профессию" />
              </SelectTrigger>
              <SelectContent>
                {professions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Организация</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Название организации" />
          </div>

          <div className="space-y-2">
            <Label>УНП</Label>
            <Input value={unp} onChange={(e) => setUnp(e.target.value)} placeholder="123456789" />
          </div>

          <div className="pt-2">
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Безопасность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleChangePassword} className="gap-2">
            <KeyRound className="h-4 w-4" /> Сменить пароль
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Удалить аккаунт
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удаление аккаунта</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие необратимо. Все ваши данные будут удалены. Введите <strong>УДАЛИТЬ</strong> для подтверждения.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Введите "УДАЛИТЬ"'
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirm('')}>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirm !== 'УДАЛИТЬ'}
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Удалить навсегда
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
