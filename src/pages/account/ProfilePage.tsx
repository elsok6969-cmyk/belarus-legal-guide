import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageSEO } from '@/components/shared/PageSEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, KeyRound, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const professions = [
  { value: 'accountant', label: 'Бухгалтер' },
  { value: 'lawyer', label: 'Юрист' },
  { value: 'hr_specialist', label: 'Кадровик' },
  { value: 'procurement_specialist', label: 'Специалист по закупкам' },
  { value: 'labor_safety', label: 'Охрана труда' },
  { value: 'economist', label: 'Экономист' },
  { value: 'financier', label: 'Финансист' },
  { value: 'ecologist', label: 'Эколог' },
  { value: 'builder', label: 'Строитель' },
  { value: 'entrepreneur', label: 'Предприниматель' },
  { value: 'manager', label: 'Руководитель' },
  { value: 'individual', label: 'Физическое лицо' },
];

const planLabels: Record<string, string> = {
  free: 'Бесплатный',
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [companyName, setCompanyName] = useState('');

  const { data: profile, isLoading } = useQuery({
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
      setProfession(profile.profession || '');
      setCompanyName(profile.company_name || '');
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName, profession: profession || null, company_name: companyName || null })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-profile'] });
      toast.success('Профиль обновлён');
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

  const plan = profile?.subscription_plan || 'free';

  return (
    <div className="space-y-6">
      <PageSEO title="Профиль" description="Управление профилем" path="/app/account/profile" noindex />
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" /> Профиль
      </h1>

      {/* Subscription card */}
      <Card className="bg-accent/30 border-primary/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crown className="h-7 w-7 text-primary" />
              <div>
                <p className="font-semibold">{planLabels[plan] || plan}</p>
                {profile?.subscription_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    до {new Date(profile.subscription_expires_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/pricing">Улучшить тариф</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Личные данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введите ваше имя" />
          </div>

          <div className="space-y-2">
            <Label>Электронная почта</Label>
            <Input value={user?.email || ''} readOnly className="bg-muted" />
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

          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Безопасность</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleChangePassword} className="gap-2">
            <KeyRound className="h-4 w-4" /> Сменить пароль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
