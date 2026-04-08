import { useState, useEffect, useCallback } from 'react';
import { X, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const SHOWN_KEY = 'babijon_exit_popup_shown';

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const show = useCallback(() => {
    if (sessionStorage.getItem(SHOWN_KEY)) return;
    sessionStorage.setItem(SHOWN_KEY, '1');
    setOpen(true);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SHOWN_KEY)) return;

    if (isMobile) {
      const timer = setTimeout(show, 60000);
      return () => clearTimeout(timer);
    }

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) show();
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [isMobile, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Введите корректный email');
      return;
    }
    setLoading(true);
    try {
      await supabase.from('email_subscribers').insert({
        email: trimmed,
        source: 'exit_popup',
      });
      toast.success('Вы подписаны!');
      setOpen(false);
    } catch {
      toast.error('Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Будьте в курсе изменений</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Получайте обзор изменений в законодательстве раз в неделю
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
            required
          />
          <Button type="submit" className="h-10 shrink-0" disabled={loading}>
            {loading ? '...' : 'Подписаться'}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Без спама. Отписаться можно в любой момент.
        </p>
      </div>
    </div>
  );
}
