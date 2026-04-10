import { useState, useEffect } from 'react';

/**
 * Returns true if `isLoading` has been true for longer than `timeoutMs`.
 * Use to show "failed to load" messages after extended loading.
 */
export function useLoadingTimeout(isLoading: boolean, timeoutMs = 10000): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [isLoading, timeoutMs]);

  return timedOut;
}
