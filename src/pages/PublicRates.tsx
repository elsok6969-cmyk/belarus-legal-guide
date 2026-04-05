import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PageSEO } from '@/components/shared/PageSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function PublicRates() {
  const { data: rates, isLoading } = useQuery({
    queryKey: ['public-rates-full'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(100);
      // Group by date
      const byDate = new Map<string, typeof data>();
      data?.forEach(r => {
        const d = r.rate_date;
        if (!byDate.has(d)) byDate.set(d, []);
        byDate.get(d)!.push(r);
      });
      return Array.from(byDate.entries()).slice(0, 5);
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageSEO title="Курсы валют НБРБ" description="Актуальные курсы валют Национального банка Республики Беларусь." path="/rates" />
      <h1 className="text-2xl font-bold mb-6">Курсы валют НБРБ</h1>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : rates && rates.length > 0 ? (
        <div className="space-y-6">
          {rates.map(([date, items]) => (
            <Card key={date} className="border">
              <CardContent className="p-5">
                <h2 className="text-sm font-bold text-muted-foreground mb-3">
                  {format(new Date(date), 'dd.MM.yyyy')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items!.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-semibold">{r.currency_code}</span>
                        <div className="text-xs text-muted-foreground">{r.currency_name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold tabular-nums">{Number(r.rate).toFixed(4)}</span>
                        {r.change_value !== null && r.change_value !== 0 && (
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${Number(r.change_value) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {Number(r.change_value) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(Number(r.change_value)).toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Курсы валют ещё не загружены. Данные обновляются ежедневно.</p>
      )}
    </div>
  );
}
