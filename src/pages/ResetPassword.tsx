import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Scale, KeyRound } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: error.message });
    } else {
      setSent(true);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Минимум 8 символов' });
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пароли не совпадают' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: error.message });
    } else {
      toast({ title: 'Пароль обновлён', description: 'Вы можете войти с новым паролем' });
      navigate('/auth');
    }
  };

  return (
    <>
      <PageSEO title="Восстановление пароля — ПравоБУ" description="Сбросьте пароль для аккаунта ПравоБУ" path="/auth/reset-password" />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              {mode === 'reset' ? <KeyRound className="h-5 w-5 text-primary-foreground" /> : <Scale className="h-5 w-5 text-primary-foreground" />}
            </div>
            <CardTitle className="text-2xl font-bold">
              {mode === 'reset' ? 'Новый пароль' : 'Восстановление пароля'}
            </CardTitle>
            <CardDescription>
              {mode === 'reset' ? 'Введите новый пароль для вашего аккаунта' : 'Введите email для получения ссылки на сброс пароля'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'request' && !sent && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Электронная почта</Label>
                  <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@example.com" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Отправка...' : 'Отправить ссылку'}
                </Button>
              </form>
            )}
            {mode === 'request' && sent && (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">
                  Если аккаунт с адресом <strong>{email}</strong> существует, мы отправили ссылку для сброса пароля.
                </p>
              </div>
            )}
            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Новый пароль</Label>
                  <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Минимум 8 символов" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Подтверждение</Label>
                  <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} placeholder="Повторите пароль" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Сохранение...' : 'Сохранить пароль'}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline hover:text-primary/80">Вернуться к входу</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
