import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Short disclaimer — 1–2 sentences. Use inline in AI responses, footers, compact spaces.
 */
export function DisclaimerShort({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Информация носит справочный характер и не является юридической консультацией. 
      Для принятия решений сверяйтесь с официальными источниками.
    </p>
  );
}

/**
 * Full disclaimer — paragraph block with icon. Use on landing, AI chat page, legal sections.
 */
export function DisclaimerFull({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="space-y-2">
          <p>
            <strong>Отказ от ответственности.</strong> Данная платформа предоставляет доступ 
            к правовой информации в справочных целях. Материалы и ответы AI-ассистента 
            не являются юридической консультацией, правовым заключением или рекомендацией 
            к действию.
          </p>
          <p>
            AI-ассистент интерпретирует тексты нормативных актов и может допускать неточности 
            или упускать существенные детали. Ответы формируются автоматически и не проходят 
            проверку юристом.
          </p>
          <p>
            При принятии юридически значимых решений всегда обращайтесь к официальным 
            публикациям нормативных правовых актов и при необходимости консультируйтесь 
            с квалифицированным специалистом.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline AI response disclaimer — compact, meant to appear after each AI answer.
 */
export function DisclaimerAIResponse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground',
        className
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Ответ сформирован автоматически и может содержать неточности. 
        Это не юридическая консультация — проверяйте информацию по первоисточникам.
      </span>
    </div>
  );
}
