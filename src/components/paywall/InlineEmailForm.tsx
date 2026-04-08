import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InlineEmailFormProps {
  source: string;
  title?: string;
  description?: string;
  className?: string;
}

export function InlineEmailForm({
  source,
  title = 'Подпишитесь на обновления',
  description = 'Получайте обзор изменений в законодательстве',
  className = '',
}: InlineEmailFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
        source,
      });
      setSubmitted(true);
      toast.success('Вы подписаны!');
    } catch {
      toast.error('Ошибка, попробуйте позже');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 p-4 rounded-xl border bg-card text-sm text-muted-foreground ${className}`}>
        <Check className="h-4 w-4 text-primary shrink-0" />
        Спасибо! Вы подписаны на обновления.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-card p-4 md:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-0.5">{title}</p>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm"
              required
            />
            <Button type="submit" size="sm" className="h-8 shrink-0 text-xs" disabled={loading}>
              {loading ? '...' : 'Подписаться'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
