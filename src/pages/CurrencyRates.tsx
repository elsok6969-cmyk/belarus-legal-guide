import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Minus, Calendar, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    </svg>
  );
}

export default function CurrencyRates() {
  const [selectedDate, setSelectedDate] = useState<string>('latest');
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertCurrency, setConvertCurrency] = useState('USD');

  const { data: dates } = useQuery({
    queryKey: ['currency-dates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_rates')
        .select('rate_date')
        .order('rate_date', { ascending: false });
      return [...new Set((data || []).map((d) => d.rate_date))];
    },
  });

  const currentDate = selectedDate === 'latest' ? dates?.[0] : selectedDate;

  const { data: rates, isLoading } = useQuery({
    queryKey: ['currency-rates', currentDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('rate_date', currentDate!)
        .order('currency_code');
      return data || [];
    },
    enabled: !!currentDate,
  });

  // History for sparklines (last 30 days)
  const { data: history } = useQuery({
    queryKey: ['currency-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_rates')
        .select('currency_code, rate, rate_date')
        .order('rate_date', { ascending: true })
        .limit(1000);
      const map: Record<string, number[]> = {};
      for (const r of data || []) {
        if (!map[r.currency_code]) map[r.currency_code] = [];
        map[r.currency_code].push(Number(r.rate));
      }
      return map;
    },
    staleTime: 3600000,
  });

  const convertResult = useMemo(() => {
    const amt = parseFloat(convertAmount) || 0;
    const r = rates?.find((x) => x.currency_code === convertCurrency);
    if (!r) return null;
    return (amt * Number(r.rate)).toFixed(2);
  }, [convertAmount, convertCurrency, rates]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Курсы валют НБРБ</h1>
        </div>
        {dates && dates.length > 1 && (
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Последние</SelectItem>
              {dates.slice(0, 30).map((d) => (
                <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Converter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Конвертер валют
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-32">
              <Label className="text-xs">Сумма</Label>
              <Input type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} />
            </div>
            <div className="w-40">
              <Label className="text-xs">Валюта</Label>
              <Select value={convertCurrency} onValueChange={setConvertCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(rates || []).map((r) => (
                    <SelectItem key={r.currency_code} value={r.currency_code}>{r.currency_code} — {r.currency_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="text-lg">=</span>
              <span className="text-xl font-bold text-primary">{convertResult ?? '—'} BYN</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rates table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentDate ? `На ${formatDate(currentDate)}` : 'Загрузка...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between py-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          ) : rates && rates.length > 0 ? (
            <div className="divide-y">
              {rates.map((r) => {
                const change = Number(r.change_value) || 0;
                const isUp = change > 0;
                const isDown = change < 0;
                return (
                  <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{r.currency_code}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{r.currency_name}</p>
                        <p className="text-xs text-muted-foreground">{r.currency_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {history?.[r.currency_code] && <MiniSparkline data={history[r.currency_code].slice(-30)} />}
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-foreground">{Number(r.rate).toFixed(4)} BYN</p>
                        <div className="flex items-center justify-end gap-1">
                          {isUp && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {isDown && <TrendingDown className="h-3 w-3 text-red-600" />}
                          {!isUp && !isDown && <Minus className="h-3 w-3 text-muted-foreground" />}
                          <span className={`text-xs font-mono ${isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {isUp ? '+' : ''}{change.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных о курсах</p>
          )}
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
            Источник: Национальный банк Республики Беларусь (nbrb.by)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
