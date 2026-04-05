import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const placeholderRates = [
  { code: 'USD', name: 'Доллар США', rate: '3.2450', change: '+0.0012' },
  { code: 'EUR', name: 'Евро', rate: '3.5120', change: '-0.0034' },
  { code: 'RUB', name: 'Российский рубль (100)', rate: '3.7800', change: '+0.0100' },
  { code: 'PLN', name: 'Польский злотый (10)', rate: '8.4500', change: '+0.0250' },
];

export default function CurrencyRates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Курсы валют НБРБ</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">На 05.04.2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {placeholderRates.map((r) => (
              <div key={r.code} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-sm">{r.code}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm">{r.rate} BYN</span>
                  <span className={`text-xs ml-2 ${r.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {r.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Данные загружаются с API НБРБ. Это заглушка.</p>
        </CardContent>
      </Card>
    </div>
  );
}
