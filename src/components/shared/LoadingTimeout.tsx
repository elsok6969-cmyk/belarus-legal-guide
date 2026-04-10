import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  isLoading: boolean;
  timeoutMs?: number;
  skeletonCount?: number;
  skeletonClassName?: string;
  children: React.ReactNode;
}

/**
 * Wraps skeleton loading with automatic 10s timeout fallback.
 * Shows "Не удалось загрузить" after timeout.
 */
export function LoadingTimeout({
  isLoading,
  timeoutMs = 10000,
  skeletonCount = 3,
  skeletonClassName = 'h-12 w-full',
  children,
}: Props) {
  const timedOut = useLoadingTimeout(isLoading, timeoutMs);

  if (!isLoading) return <>{children}</>;

  if (timedOut) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: skeletonCount }, (_, i) => (
        <Skeleton key={i} className={skeletonClassName} />
      ))}
    </div>
  );
}
