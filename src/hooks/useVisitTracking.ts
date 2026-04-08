import { useEffect, useMemo } from 'react';

const VISIT_KEY = 'babijon_visit_count';
const ARTICLES_KEY = 'babijon_articles_read';
const FIRST_VISIT_KEY = 'babijon_first_visit';
const WEEK_RESET_KEY = 'babijon_week_reset';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

function getNum(key: string): number {
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch { return 0; }
}

function setNum(key: string, val: number) {
  try { localStorage.setItem(key, String(val)); } catch {}
}

export function useVisitTracking() {
  useEffect(() => {
    // Increment visit count once per session
    const sessionKey = 'babijon_session_counted';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      setNum(VISIT_KEY, getNum(VISIT_KEY) + 1);
    }

    // Set first visit timestamp
    if (!localStorage.getItem(FIRST_VISIT_KEY)) {
      localStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
    }

    // Reset weekly article count
    const lastReset = getNum(WEEK_RESET_KEY);
    if (Date.now() - lastReset > ONE_WEEK) {
      setNum(ARTICLES_KEY, 0);
      setNum(WEEK_RESET_KEY, Date.now());
    }
  }, []);

  const visitCount = useMemo(() => getNum(VISIT_KEY), []);

  const incrementArticlesRead = () => {
    setNum(ARTICLES_KEY, getNum(ARTICLES_KEY) + 1);
  };

  const getFreeSectionsLimit = (): number => {
    const visits = getNum(VISIT_KEY);
    if (visits >= 8) return 1;
    if (visits >= 4) return 3;
    return 5;
  };

  return { visitCount, incrementArticlesRead, getFreeSectionsLimit };
}

export function getSessionId(): string {
  const key = 'babijon_session_id';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}
