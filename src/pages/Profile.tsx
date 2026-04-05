import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PageSEO } from '@/components/shared/PageSEO';
import { Crown, Bookmark, History, Bell, Settings, Trash2, X, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

const planLabels: Record<string, string> = { free: 'Бесплатный', standard: 'Стандарт', pro: 'Профи', business: 'Бизнес' };
const AI_LIMIT_FREE = 5;

interface ProfileData {
  plan: string;
  plan_expires_at: string | null;
  ai_requests_today: number;
  full_name: string | null;
  email: string | null;
  display_name: string | null;
}

interface DocItem {
  id: string;
  title: string;
  doc_type: string;
  slug: string | null;
  created_at?: string;
  viewed_at?: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookmarks, setBookmarks] = useState<DocItem[]>([]);
  const [history, setHistory] = useState<DocItem[]>([]);
  const [subs, setSubs] = useState<DocItem[]>([]);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, bookmarksRes, historyRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('plan, plan_expires_at, ai_requests_today, full_name, email, display_name').eq('user_id', user.id).single(),
      supabase.from('bookmarks').select('id, created_at, document_id, documents(id, title, doc_type, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('view_history').select('id, viewed_at, document_id, documents(id, title, doc_type, slug)').eq('user_id', user.id).order('viewed_at', { ascending: false }).limit(20),
      supabase.from('subscriptions').select('id, created_at, document_id, documents(id, title, doc_type, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as unknown as ProfileData);
      setEditName(profileRes.data.full_name || profileRes.data.display_name || '');
    }

    const mapDocs = (items: any[]) =>
      (items || []).map((item: any) => ({
        id: item.id,
        title: item.documents?.title || 'Без названия',
        doc_type: item.documents?.doc_type || '',
        slug: item.documents?.slug || null,
        created_at: item.created_at,
        viewed_at: item.viewed_at,
      }));

    setBookmarks(mapDocs(bookmarksRes.data || []));
    setHistory(mapDocs(historyRes.data || []));
    setSubs(mapDocs(subsRes.data || []));
    setLoading(false);
  };

  const saveName = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: editName }).eq('user_id', user.id);
    setSaving(false);
    toast({ title: 'Сохранено' });
  };

  const removeBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from('view_history').delete().eq('user_id', user.id);
    setHistory([]);
    toast({ title: 'История очищена' });
  };

  const unsubscribe = async (id: string) => {
    await supabase.from('subscriptions').delete().eq('id', id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: error.message });
    } else {
      toast({ title: 'Проверьте почту', description: 'Ссылка для смены пароля отправлена на вашу почту' });
    }
  };

  const plan = profile?.plan || 'free';
  const aiUsed = profile?.ai_requests_today || 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const DocList = ({ items, type, onRemove }: { items: DocItem[]; type: 'bookmark' | 'history' | 'sub'; onRemove?: (id: string) => void }) => {
    if (items.length === 0) {
      const messages = {
        bookmark: 'Добавляйте документы в закладки с помощью кнопки ★',
        history: 'Вы ещё не просматривали документы',
        sub: 'Подпишитесь на документ, чтобы получать уведомления об изменениях',
      };
      return <p className="text-sm text-muted-foreground py-8 text-center">{messages[type]}</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs shrink-0">{item.doc_type}</Badge>
                <span className="text-xs text-muted-foreground">
                  {item.viewed_at ? new Date(item.viewed_at).toLocaleDateString('ru-RU') : item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                </span>
              </div>
              <Link
                to={item.slug ? `/doc/${item.slug}` : '#'}
                className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {item.title}
              </Link>
            </div>
            {onRemove && (
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.id)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <PageSEO title="Профиль — ПравоБУ" description="Управление аккаунтом ПравоБУ" path="/profile" />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Профиль</h1>

        {/* Plan card */}
        <Card className="bg-accent/30 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-lg">{planLabels[plan] || plan}</p>
                  {profile?.plan_expires_at && (
                    <p className="text-sm text-muted-foreground">
                      до {new Date(profile.plan_expires_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
              <Button asChild>
                <Link to="/subscription">Улучшить тариф</Link>
              </Button>
            </div>
            {plan === 'free' && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI-запросы сегодня</span>
                  <span className="font-medium">{aiUsed} / {AI_LIMIT_FREE}</span>
                </div>
                <Progress value={(aiUsed / AI_LIMIT_FREE) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="bookmarks">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookmarks" className="gap-1.5"><Bookmark className="h-3.5 w-3.5 hidden sm:block" />Закладки</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5 hidden sm:block" />История</TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5"><Bell className="h-3.5 w-3.5 hidden sm:block" />Подписки</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5 hidden sm:block" />Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks" className="mt-4">
            <DocList items={bookmarks} type="bookmark" onRemove={removeBookmark} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length > 0 && (
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={clearHistory} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />Очистить историю
                </Button>
              </div>
            )}
            <DocList items={history} type="history" />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <DocList items={subs} type="sub" onRemove={unsubscribe} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Имя</Label>
                <div className="flex gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ваше имя" />
                  <Button onClick={saveName} disabled={saving}>{saving ? '...' : 'Сохранить'}</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Электронная почта</Label>
                <Input value={profile?.email || user?.email || ''} readOnly className="bg-muted" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Button variant="outline" onClick={handleChangePassword}>Сменить пароль</Button>
              <div>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                  Удалить аккаунт
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Все ваши данные будут удалены. Для удаления аккаунта свяжитесь с поддержкой.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => { setDeleteOpen(false); toast({ title: 'Заявка отправлена', description: 'Мы свяжемся с вами для подтверждения удаления' }); }}>
              Отправить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
