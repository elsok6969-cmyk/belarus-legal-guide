import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function CurrencyRates() {
  const [selectedDate, setSelectedDate] = useState<string>('latest');

  const { data: dates } = useQuery({
    queryKey: ['currency-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('rate_date')
        .order('rate_date', { ascending: false });
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.rate_date))];
      return unique;
    },
  });

  const currentDate = selectedDate === 'latest' ? dates?.[0] : selectedDate;

  const { data: rates, isLoading } = useQuery({
    queryKey: ['currency-rates', currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('rate_date', currentDate!)
        .order('currency_code');
      if (error) throw error;
      return data;
    },
    enabled: !!currentDate,
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Курсы валют НБРБ</h1>
        </div>
        {dates && dates.length > 1 && (
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Последние</SelectItem>
              {dates.map((d) => (
                <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

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
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{r.currency_code}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.currency_name}</p>
                        <p className="text-xs text-muted-foreground">{r.currency_code}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {Number(r.rate).toFixed(4)} BYN
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {isUp && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {isDown && <TrendingDown className="h-3 w-3 text-red-600" />}
                          {!isUp && !isDown && <Minus className="h-3 w-3 text-muted-foreground" />}
                          <span
                            className={`text-xs font-mono ${
                              isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-muted-foreground'
                            }`}
                          >
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
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет данных о курсах за выбранную дату
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
            Источник: Национальный банк Республики Беларусь (nbrb.by)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
