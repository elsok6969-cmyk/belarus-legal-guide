import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NbrbRate {
  Cur_ID: number;
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_Name: string;
  Cur_OfficialRate: number;
  Date: string;
}

export interface NormalizedRate {
  currency_code: string;
  currency_name: string;
  rate: number;
  scale: number;
  rate_date: string;
  change_value: number | null;
  id: string;
}

const TRACKED = ['USD', 'EUR', 'RUB', 'PLN', 'GBP', 'CNY', 'UAH', 'JPY', 'CHF', 'CZK', 'TRY', 'KZT'];

async function fetchFromNbrb(): Promise<NormalizedRate[]> {
  const res = await fetch('https://api.nbrb.by/exrates/rates?periodicity=0');
  if (!res.ok) throw new Error('NBRB API error');
  const data: NbrbRate[] = await res.json();
  const dateStr = new Date().toISOString().slice(0, 10);

  return data
    .filter(r => TRACKED.includes(r.Cur_Abbreviation))
    .map(r => ({
      currency_code: r.Cur_Abbreviation,
      currency_name: r.Cur_Name,
      rate: r.Cur_OfficialRate,
      scale: r.Cur_Scale,
      rate_date: dateStr,
      change_value: null,
      id: `nbrb-${r.Cur_Abbreviation}`,
    }));
}

async function fetchFromSupabase(): Promise<NormalizedRate[]> {
  const { data } = await supabase
    .from('currency_rates')
    .select('*')
    .order('rate_date', { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];

  const latestDate = data[0].rate_date;
  return data
    .filter(r => r.rate_date === latestDate)
    .map(r => ({
      currency_code: r.currency_code,
      currency_name: r.currency_name,
      rate: Number(r.rate),
      scale: 1,
      rate_date: r.rate_date,
      change_value: r.change_value ? Number(r.change_value) : null,
      id: r.id,
    }));
}

export function useFreshRates() {
  return useQuery({
    queryKey: ['fresh-currency-rates'],
    queryFn: async () => {
      // Try NBRB API first for fresh data
      try {
        const nbrbRates = await fetchFromNbrb();
        if (nbrbRates.length > 0) return nbrbRates;
      } catch {
        // fall through to Supabase
      }
      return fetchFromSupabase();
    },
    staleTime: 3600000, // 1 hour
  });
}
