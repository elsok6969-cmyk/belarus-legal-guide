import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/shared/PageSEO';
import { supabase } from '@/integrations/supabase/client';

const flagMap: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳', PLN: '🇵🇱',
  UAH: '🇺🇦', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭', CAD: '🇨🇦',
  AUD: '🇦🇺', CZK: '🇨🇿', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰',
  KZT: '🇰🇿', TRY: '🇹🇷', SGD: '🇸🇬', KRW: '🇰🇷', INR: '🇮🇳',
  BRL: '🇧🇷', IRR: '🇮🇷', ILS: '🇮🇱', KWD: '🇰🇼', MDL: '🇲🇩',
  AZN: '🇦🇿', GEL: '🇬🇪', TMT: '🇹🇲', UZS: '🇺🇿', BGN: '🇧🇬',
  HUF: '🇭🇺', XDR: '🌐', NZD: '🇳🇿', ARS: '🇦🇷', EGP: '🇪🇬',
};

const priorityCodes = ['USD', 'EUR', 'RUB', 'CNY', 'PLN'];

export default function Currencies() {
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [direction, setDirection] = useState<'toByn' | 'fromByn'>('toByn');
  const [searchFilter, setSearchFilter] = useState('');
  const loadingTimedOut = useLoadingTimeout(isLoading);

  const { data: rates, isLoading, isError } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: async () => {
      // Try NBRB API first for fresh data
      try {
        const resp = await fetch('https://api.nbrb.by/exrates/rates?periodicity=0');
        if (resp.ok) {
          const nbrb = await resp.json();
          const mapped = nbrb.map((r: any) => ({
            id: String(r.Cur_ID),
            currency_code: r.Cur_Abbreviation,
            currency_name: r.Cur_Name,
            rate: r.Cur_OfficialRate / (r.Cur_Scale || 1),
            rate_date: r.Date?.split('T')[0] || new Date().toISOString().split('T')[0],
            change_value: 0,
            created_at: new Date().toISOString(),
          }));
          // Cache to localStorage for offline fallback
          localStorage.setItem('nbrb_rates_cache', JSON.stringify({
            data: mapped,
            timestamp: Date.now(),
          }));
          return mapped;
        }
      } catch (e) {
      }

      // Fallback 1: Supabase cached data
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .order('rate_date', { ascending: false });
      if (!error && data && data.length > 0) {
        const seen = new Set<string>();
        const deduped = data.filter(r => {
          if (seen.has(r.currency_code)) return false;
          seen.add(r.currency_code);
          return true;
        });
        if (deduped.length > 0) return deduped;
      }

      // Fallback 2: localStorage cache (up to 24 hours)
      const cached = localStorage.getItem('nbrb_rates_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < 24 * 60 * 60 * 1000 && parsed.data?.length > 0) {
            return parsed.data;
          }
        } catch (e) {
        }
      }

      return [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const sortedRates = useMemo(() => {
    if (!rates) return [];
    return [...rates].sort((a, b) => {
      const ai = priorityCodes.indexOf(a.currency_code);
      const bi = priorityCodes.indexOf(b.currency_code);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.currency_code.localeCompare(b.currency_code);
    });
  }, [rates]);

  // Set initial currency when rates load
  useEffect(() => {
    if (sortedRates.length > 0) {
      const hasUSD = sortedRates.some(r => r.currency_code === 'USD');
      if (!hasUSD && sortedRates[0]) {
        setCurrency(sortedRates[0].currency_code);
      }
    }
  }, [sortedRates]);

  const filteredRates = useMemo(() => {
    if (!searchFilter.trim()) return sortedRates;
    const q = searchFilter.toLowerCase();
    return sortedRates.filter(r =>
      r.currency_code.toLowerCase().includes(q) ||
      r.currency_name.toLowerCase().includes(q)
    );
  }, [sortedRates, searchFilter]);

  const rateDate = rates?.[0]?.rate_date;
  const formattedDate = rateDate
    ? new Date(rateDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const convertResult = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const r = rates?.find(x => x.currency_code === currency);
    if (!r) return null;
    const rateVal = Number(r.rate);
    if (direction === 'toByn') {
      return (amt * rateVal).toFixed(2);
    }
    return rateVal > 0 ? (amt / rateVal).toFixed(4) : null;
  }, [amount, currency, rates, direction]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO
        title="Курсы валют НБРБ — конвертер"
        description="Актуальные курсы валют Национального банка Республики Беларусь. Онлайн конвертер валют."
        path="/currencies"
      />

      <h1 className="text-2xl md:text-3xl font-bold mb-1">Курсы валют НБРБ</h1>
      {formattedDate && (
        <p className="text-muted-foreground text-sm mb-6">Официальные курсы на {formattedDate}</p>
      )}

      {/* Converter */}
      <Card className="mb-8 rounded-xl border hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Конвертер валют
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-0">
              <Label className="text-xs text-muted-foreground">
                {direction === 'toByn' ? 'Сумма в валюте' : 'Сумма в BYN'}
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xl h-[52px] font-semibold mt-1"
                placeholder="100"
              />
            </div>

            {direction === 'toByn' ? (
              <div className="w-full sm:w-40">
                <Label className="text-xs text-muted-foreground">Валюта</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={isLoading || sortedRates.length === 0}>
                  <SelectTrigger className="h-[52px] text-base mt-1">
                    <SelectValue placeholder={isLoading ? 'Загрузка...' : 'Выберите'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedRates.map(r => (
                      <SelectItem key={r.currency_code} value={r.currency_code}>
                        {flagMap[r.currency_code] || '💰'} {r.currency_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-end pb-0.5">
                <span className="text-xl font-semibold h-[52px] flex items-center px-3 border rounded-lg bg-muted">BYN</span>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-[52px] w-[52px] shrink-0 self-end"
              onClick={() => setDirection(d => d === 'toByn' ? 'fromByn' : 'toByn')}
              aria-label="Сменить направление"
            >
              ⇄
            </Button>

            {direction === 'fromByn' ? (
              <div className="w-full sm:w-40">
                <Label className="text-xs text-muted-foreground">Валюта</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={isLoading || sortedRates.length === 0}>
                  <SelectTrigger className="h-[52px] text-base mt-1">
                    <SelectValue placeholder={isLoading ? 'Загрузка...' : 'Выберите'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedRates.map(r => (
                      <SelectItem key={r.currency_code} value={r.currency_code}>
                        {flagMap[r.currency_code] || '💰'} {r.currency_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-end pb-0.5">
                <span className="text-xl font-semibold h-[52px] flex items-center px-3 border rounded-lg bg-muted">BYN</span>
              </div>
            )}

            <div className="flex items-end pb-0.5">
              <span className="text-lg">=</span>
            </div>
            <div className="flex-1 min-w-0 flex items-end">
              <div className="text-xl font-bold text-primary h-[52px] flex items-center">
                {convertResult ?? '—'} {direction === 'toByn' ? 'BYN' : currency}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rates table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Все курсы</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Найти валюту..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive text-center py-8">Не удалось загрузить курсы. Попробуйте обновить страницу.</p>
          ) : isLoading ? (
            useLoadingTimeout(isLoading) ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-sm text-primary hover:underline">Обновить страницу</button>
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            )
          ) : filteredRates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Валюта</th>
                     <th className="pb-2 font-medium text-right">Курс BYN</th>
                     <th className="pb-2 font-medium text-right hidden sm:table-cell">Изменение</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRates.map((r) => {
                    const change = Number(r.change_value) || 0;
                    const isUp = change > 0;
                    const isDown = change < 0;
                    return (
                      <tr key={r.id} className="hover:bg-accent/50 transition-colors duration-150">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{flagMap[r.currency_code] || '💰'}</span>
                            <div>
                              <span className="font-semibold">{r.currency_code}</span>
                              <span className="text-xs text-muted-foreground">{r.currency_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">{r.rate.toFixed(4)}</td>
                        <td className="py-3 text-right hidden sm:table-cell">
                          <span className={cn(
                            'text-sm font-medium',
                            isUp && 'text-emerald-600',
                            isDown && 'text-red-500',
                            !isUp && !isDown && 'text-muted-foreground'
                          )}>
                            {isUp ? '+' : ''}{change.toFixed(4)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Валюты не найдены</p>
          )}
          </CardContent>
        </Card>
      </div>
  );
}