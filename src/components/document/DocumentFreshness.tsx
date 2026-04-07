import { ExternalLink, CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  lastUpdated: string | null;
  sourceUrl: string | null;
}

export function DocumentFreshness({ lastUpdated, sourceUrl }: Props) {
  const now = new Date();
  const updatedDate = lastUpdated ? new Date(lastUpdated) : null;
  const daysSince = updatedDate ? differenceInDays(now, updatedDate) : null;

  const isStale = daysSince !== null && daysSince > 30;
  const formattedDate = updatedDate
    ? format(updatedDate, 'd MMMM yyyy', { locale: ru })
    : null;

  return (
    <div className="mt-8 pt-6 border-t border-border space-y-3">
      {/* Freshness badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isStale ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400">
              ⚠️ Давно не проверялось (последняя проверка: {formattedDate})
            </span>
          </>
        ) : formattedDate ? (
          <>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>Актуальность проверена: {formattedDate}</span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5" />
            <span>Дата проверки неизвестна</span>
          </>
        )}
      </div>

      {/* Source link */}
      {sourceUrl && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Источник: </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            pravo.by
          </a>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>
          Данные предоставлены в информационных целях и не являются юридической консультацией.
          Официальный источник:{' '}
          <a href="https://pravo.by" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            pravo.by
          </a>.
          {formattedDate && ` Дата последней синхронизации: ${formattedDate}.`}
        </p>
      </div>
    </div>
  );
}
