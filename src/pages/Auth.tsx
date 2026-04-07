import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';

export default function Auth() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regName, setRegName] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full" style={{ border: '4px solid hsl(var(--amber-500))', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (user) return <Navigate to="/profile" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginSubmitting(false);
    if (error) toast({ variant: 'destructive', title: 'Ошибка входа', description: error.message });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 8) { toast({ variant: 'destructive', title: 'Ошибка', description: 'Пароль должен содержать минимум 8 символов' }); return; }
    if (regPassword !== regConfirm) { toast({ variant: 'destructive', title: 'Ошибка', description: 'Пароли не совпадают' }); return; }
    if (!regAgree) { toast({ variant: 'destructive', title: 'Ошибка', description: 'Необходимо принять условия использования' }); return; }
    setRegSubmitting(true);
    const { error } = await supabase.auth.signUp({ email: regEmail, password: regPassword, options: { data: { display_name: regName, full_name: regName }, emailRedirectTo: window.location.origin } });
    setRegSubmitting(false);
    if (error) toast({ variant: 'destructive', title: 'Ошибка регистрации', description: error.message });
    else setRegSuccess(true);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) { toast({ variant: 'destructive', title: 'Ошибка', description: String(result.error) }); setGoogleLoading(false); }
    if (result.redirected) return;
    setGoogleLoading(false);
  };

  const inputStyle = {
    border: '2px solid hsl(var(--gray-200))',
    borderRadius: 12,
    height: 48,
    padding: '0 16px',
    fontSize: 15,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: 'transparent',
    color: 'hsl(var(--gray-900))',
  };

  return (
    <>
      <PageSEO title="Авторизация — Бабиджон" description="Войдите или зарегистрируйтесь" path="/auth" />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
        <div className="card-apple w-full" style={{ maxWidth: 400 }}>
          <div className="text-center mb-6">
            <h2>Войти в Бабиджон</h2>
          </div>

          {/* Tabs */}
          <div className="flex mb-6" style={{ background: 'hsl(var(--gray-100))', borderRadius: 12, padding: 4 }}>
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 text-center py-2 text-sm font-medium transition-all"
                style={{
                  borderRadius: 10,
                  background: activeTab === tab ? 'white' : 'transparent',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  color: activeTab === tab ? 'hsl(var(--navy-900))' : 'hsl(var(--gray-600))',
                }}
              >
                {tab === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Электронная почта</Label>
                <input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="user@example.com" style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Пароль</Label>
                  <Link to="/auth/reset-password" className="text-xs transition-colors" style={{ color: 'hsl(var(--navy-600))' }}>Забыли пароль?</Link>
                </div>
                <input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loginSubmitting}>
                {loginSubmitting ? 'Вход...' : 'Войти'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            regSuccess ? (
              <div className="text-center space-y-3 py-6">
                <Mail className="h-12 w-12 mx-auto" style={{ color: 'hsl(var(--amber-500))' }} />
                <h3>Проверьте почту</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--gray-600))' }}>
                  Мы отправили письмо на <strong>{regEmail}</strong>. Перейдите по ссылке в письме для подтверждения аккаунта.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Имя</Label>
                  <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Иван Иванов" style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Электронная почта</Label>
                  <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="user@example.com" style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Пароль</Label>
                  <input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={8} placeholder="Минимум 8 символов" style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" style={{ fontSize: 14, color: 'hsl(var(--gray-700))' }}>Подтверждение пароля</Label>
                  <input id="reg-confirm" type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} required minLength={8} placeholder="Повторите пароль" style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--amber-500))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--gray-200))'; }}
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="reg-agree" checked={regAgree} onCheckedChange={(v) => setRegAgree(v === true)} className="mt-0.5" />
                  <label htmlFor="reg-agree" className="text-sm cursor-pointer" style={{ color: 'hsl(var(--gray-600))', lineHeight: 1.4 }}>
                    Я соглашаюсь с{' '}
                    <Link to="/legal" className="underline" style={{ color: 'hsl(var(--navy-600))' }}>условиями использования</Link>
                  </label>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={regSubmitting}>
                  {regSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </form>
            )
          )}

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs" style={{ background: 'white', color: 'hsl(var(--gray-400))' }}>или</span>
          </div>

          <button
            type="button"
            className="btn-secondary w-full flex items-center justify-center gap-2"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Войти через Google
          </button>
        </div>
      </div>
    </>
  );
}
