import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageSEO } from '@/components/shared/PageSEO';
import { Search, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const flagMap: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', CNY: '🇨🇳', PLN: '🇵🇱', UAH: '🇺🇦', GBP: '🇬🇧',
  CHF: '🇨🇭', JPY: '🇯🇵', CZK: '🇨🇿', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', CAD: '🇨🇦',
  AUD: '🇦🇺', KZT: '🇰🇿', TRY: '🇹🇷', BYN: '🇧🇾',
};

const priorityOrder = ['USD', 'EUR', 'RUB', 'CNY', 'PLN', 'UAH', 'GBP'];

function MiniSparkline({ data, color = 'hsl(var(--amber-500))' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PublicCurrencies() {
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('100');
  const [selectedCode, setSelectedCode] = useState('USD');
  const [reverse, setReverse] = useState(false);

  // Latest rates (one per currency, latest date)
  const { data: allRates } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, currency_name, rate, change_value, rate_date')
        .order('rate_date', { ascending: false })
        .limit(500);
      // Deduplicate: keep first (latest) per code
      const seen = new Set<string>();
      const unique: typeof data = [];
      (data ?? []).forEach((r) => {
        if (!seen.has(r.currency_code)) { seen.add(r.currency_code); unique.push(r); }
      });
      return unique;
    },
  });

  // History for sparklines
  const { data: history } = useQuery({
    queryKey: ['currencies-history'],
    queryFn: async () => {
      const { data } = await supabase.from('currency_rates')
        .select('currency_code, rate, rate_date')
        .order('rate_date', { ascending: true })
        .limit(1000);
      const grouped: Record<string, number[]> = {};
      (data ?? []).forEach((r) => {
        if (!grouped[r.currency_code]) grouped[r.currency_code] = [];
        grouped[r.currency_code].push(Number(r.rate));
      });
      Object.keys(grouped).forEach((k) => { grouped[k] = grouped[k].slice(-7); });
      return grouped;
    },
  });

  const sortedRates = useMemo(() => {
    if (!allRates) return [];
    const filtered = search
      ? allRates.filter((r) =>
          r.currency_code.toLowerCase().includes(search.toLowerCase()) ||
          r.currency_name.toLowerCase().includes(search.toLowerCase())
        )
      : allRates;
    return filtered.sort((a, b) => {
      const ai = priorityOrder.indexOf(a.currency_code);
      const bi = priorityOrder.indexOf(b.currency_code);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.currency_code.localeCompare(b.currency_code);
    });
  }, [allRates, search]);

  const selectedRate = allRates?.find((r) => r.currency_code === selectedCode);
  const rateValue = selectedRate ? Number(selectedRate.rate) : 1;
  const amountNum = Number(amount) || 0;
  const result = reverse ? (rateValue > 0 ? amountNum / rateValue : 0) : amountNum * rateValue;

  const latestDate = allRates?.[0]?.rate_date;

  return (
    <div className="container-apple py-10 md:py-16">
      <PageSEO
        title="Курсы валют НБРБ"
        description="Официальные курсы валют Национального банка Республики Беларусь. Конвертер валют, графики изменения курсов."
        path="/currencies"
      />

      <h1>Курсы валют НБРБ</h1>
      <p className="mt-2" style={{ fontSize: 17, color: 'hsl(var(--gray-600))' }}>
        Официальные курсы Национального банка Республики Беларусь
      </p>
      {latestDate && (
        <p style={{ fontSize: 14, color: 'hsl(var(--gray-400))', marginTop: 4 }}>
          на {format(new Date(latestDate), 'd MMMM yyyy г.', { locale: ru })}
        </p>
      )}

      {/* ═══ CONVERTER ═══ */}
      <div className="card-apple mt-8" style={{ background: 'hsl(var(--gray-50))', padding: '24px 28px' }}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label style={{ fontSize: 12, color: 'hsl(var(--gray-400))', marginBottom: 4, display: 'block' }}>
              {reverse ? 'Сумма в BYN' : 'Сумма'}
            </label>
            <div className="flex gap-2">
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white outline-none font-semibold"
                style={{ height: 56, fontSize: 24, borderRadius: 12, border: '2px solid hsl(var(--gray-200))', padding: '0 16px', fontVariantNumeric: 'tabular-nums' }}
                onFocus={(e) => { e.target.style.borderColor = 'hsl(var(--amber-500))'; }}
                onBlur={(e) => { e.target.style.borderColor = 'hsl(var(--gray-200))'; }}
              />
              {!reverse && (
                <select
                  value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}
                  className="bg-white font-medium outline-none cursor-pointer"
                  style={{ height: 56, fontSize: 16, borderRadius: 12, border: '2px solid hsl(var(--gray-200))', padding: '0 12px', minWidth: 90 }}
                >
                  {(allRates ?? []).map((r) => (
                    <option key={r.currency_code} value={r.currency_code}>{r.currency_code}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            onClick={() => setReverse(!reverse)}
            className="btn-ghost shrink-0 rounded-full"
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Поменять направление"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>

          <div className="flex-1 w-full">
            <label style={{ fontSize: 12, color: 'hsl(var(--gray-400))', marginBottom: 4, display: 'block' }}>
              {reverse ? `Результат (${selectedCode})` : 'Результат (BYN)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text" readOnly value={result.toFixed(4)}
                className="flex-1 bg-white font-semibold"
                style={{ height: 56, fontSize: 24, borderRadius: 12, border: '2px solid hsl(var(--gray-200))', padding: '0 16px', color: 'hsl(var(--navy-900))', fontVariantNumeric: 'tabular-nums' }}
              />
              {reverse && (
                <select
                  value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}
                  className="bg-white font-medium outline-none cursor-pointer"
                  style={{ height: 56, fontSize: 16, borderRadius: 12, border: '2px solid hsl(var(--gray-200))', padding: '0 12px', minWidth: 90 }}
                >
                  {(allRates ?? []).map((r) => (
                    <option key={r.currency_code} value={r.currency_code}>{r.currency_code}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="mt-8 flex items-center gap-2" style={{ maxWidth: 320 }}>
        <Search className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--gray-400))' }} />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Найти валюту..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'hsl(var(--gray-900))', borderBottom: '1px solid hsl(var(--gray-200))', padding: '8px 0' }}
        />
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid hsl(var(--gray-200))' }}>
              <th className="text-left py-3 text-xs font-medium" style={{ color: 'hsl(var(--gray-400))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Валюта</th>
              <th className="text-left py-3 text-xs font-medium" style={{ color: 'hsl(var(--gray-400))' }}>Название</th>
              <th className="text-right py-3 text-xs font-medium" style={{ color: 'hsl(var(--gray-400))' }}>Курс (BYN)</th>
              <th className="text-right py-3 text-xs font-medium" style={{ color: 'hsl(var(--gray-400))' }}>Изменение</th>
              <th className="text-right py-3 text-xs font-medium hidden md:table-cell" style={{ color: 'hsl(var(--gray-400))' }}>7 дней</th>
            </tr>
          </thead>
          <tbody>
            {sortedRates.map((r) => {
              const change = Number(r.change_value) || 0;
              const sparkData = history?.[r.currency_code] ?? [];
              return (
                <tr
                  key={r.currency_code}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid hsl(var(--gray-100))' }}
                  onClick={() => setSelectedCode(r.currency_code)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--gray-50))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="py-3.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <span className="flex items-center gap-2">
                      <span style={{ fontSize: 18 }}>{flagMap[r.currency_code] || '🏳️'}</span>
                      <span className="font-medium" style={{ fontSize: 14, color: 'hsl(var(--navy-900))' }}>{r.currency_code}</span>
                    </span>
                  </td>
                  <td className="py-3.5 text-sm" style={{ color: 'hsl(var(--gray-600))' }}>{r.currency_name}</td>
                  <td className="py-3.5 text-right font-semibold" style={{ fontSize: 15, color: 'hsl(var(--navy-900))', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(r.rate).toFixed(4)}
                  </td>
                  <td className="py-3.5 text-right text-sm" style={{
                    color: change > 0 ? 'hsl(var(--green-text))' : change < 0 ? 'hsl(var(--red-text))' : 'hsl(var(--gray-400))',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {change > 0 ? `▲ +${change.toFixed(4)}` : change < 0 ? `▼ ${change.toFixed(4)}` : '—'}
                  </td>
                  <td className="py-3.5 text-right hidden md:table-cell">
                    <div className="inline-block">
                      <MiniSparkline data={sparkData} color={change >= 0 ? 'hsl(var(--green-text))' : 'hsl(var(--red-text))'} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'hsl(var(--gray-400))' }}>
        Источник: Национальный банк Республики Беларусь (nbrb.by). Курсы носят справочный характер.
      </p>
    </div>
  );
}
