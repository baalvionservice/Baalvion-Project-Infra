"use client";
/**
 * @file duty-calculator-form.tsx
 * @description Public import-duty / landed-cost calculator. Posts to
 * `/api/gckb/public/duty-calculator` and renders the itemised breakdown,
 * highlighting any FTA preference saving. Computation is entirely server-side
 * over the published knowledge base; this component only collects input and
 * presents the result.
 */
import { useMemo, useState } from 'react';
import { Calculator, Loader2, ArrowDownRight, BadgePercent } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CountrySummary } from '@/server/gckb/public-read';
import type { DutyEstimate } from '@/server/gckb/duty-calculator';

type Props = {
  countries: CountrySummary[];
};

const FALLBACK_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'JPY', 'CNY'];

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function DutyCalculatorForm({ countries }: Props) {
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [customsValue, setCustomsValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DutyEstimate | null>(null);

  const currencyOptions = useMemo(() => {
    const set = new Set<string>(FALLBACK_CURRENCIES);
    for (const c of countries) for (const code of c.currencyCodes) set.add(code);
    return [...set].sort();
  }, [countries]);

  const canSubmit = destination && hsCode.trim() && Number(customsValue) > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/gckb/public/duty-calculator', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          destinationCountryCode: destination,
          originCountryCode: origin || undefined,
          hsCode: hsCode.trim(),
          customsValue: Number(customsValue),
          currency,
          quantity: quantity ? Number(quantity) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
      setResult(json.data as DutyEstimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20';
  const labelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/50 p-6">
        <div className="flex items-center gap-2 text-primary">
          <Calculator className="size-4" />
          <h2 className="text-sm font-black uppercase tracking-widest">Duty Calculator</h2>
        </div>

        <div>
          <label className={labelClass} htmlFor="dc-dest">Destination country</label>
          <select id="dc-dest" className={fieldClass} value={destination} onChange={(e) => setDestination(e.target.value)} required>
            <option value="">Select…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="dc-origin">Country of origin (for FTA preference)</label>
          <select id="dc-origin" className={fieldClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="">None / unknown</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="dc-hs">HS code</label>
          <input id="dc-hs" className={cn(fieldClass, 'font-mono')} value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="e.g. 100630" inputMode="numeric" required />
        </div>

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className={labelClass} htmlFor="dc-value">Customs value</label>
            <input id="dc-value" className={cn(fieldClass, 'tabular-nums')} value={customsValue} onChange={(e) => setCustomsValue(e.target.value)} placeholder="0.00" inputMode="decimal" type="number" min="0" step="0.01" required />
          </div>
          <div>
            <label className={labelClass} htmlFor="dc-cur">Currency</label>
            <select id="dc-cur" className={fieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="dc-qty">Quantity (optional, for specific-rate duties)</label>
          <input id="dc-qty" className={cn(fieldClass, 'tabular-nums')} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="units" inputMode="decimal" type="number" min="0" step="any" />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest transition',
            canSubmit ? 'bg-primary text-primary-foreground hover:opacity-90' : 'cursor-not-allowed bg-white/5 text-slate-500',
          )}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
          {loading ? 'Calculating…' : 'Estimate duty'}
        </button>

        {error ? <p className="text-xs font-bold text-red-400">{error}</p> : null}
      </form>

      {/* Result */}
      <div className="min-h-[320px]">
        {result ? <Result estimate={result} formatMoney={money} /> : (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 p-12 text-center">
            <div>
              <Calculator className="mx-auto size-8 text-slate-600" />
              <p className="mt-4 text-sm font-bold text-slate-300">Enter a shipment to estimate landed cost.</p>
              <p className="mt-1 text-xs text-slate-500">Add a country of origin to test FTA preference savings.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ estimate, formatMoney }: { estimate: DutyEstimate; formatMoney: (v: number, c: string) => string }) {
  const { currency, customsValue, lines, totals, ftaApplied, notes, disclaimer } = estimate;
  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/50 p-6">
      {ftaApplied && ftaApplied.saving > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <BadgePercent className="mt-0.5 size-5 text-emerald-400" />
          <div>
            <p className="text-sm font-black text-emerald-300">FTA preference applied — {ftaApplied.name}</p>
            <p className="text-xs text-emerald-200/80">
              Duty {formatMoney(ftaApplied.preferentialDuty, currency)} vs MFN {formatMoney(ftaApplied.mfnDuty, currency)} ·
              <span className="font-bold"> save {formatMoney(ftaApplied.saving, currency)}</span>
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2.5">Charge</th>
              <th className="px-4 py-2.5">Basis</th>
              <th className="px-4 py-2.5 text-right">Rate</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="px-4 py-2.5 font-bold text-white">Customs value</td>
              <td className="px-4 py-2.5 text-slate-500">Declared</td>
              <td className="px-4 py-2.5 text-right text-slate-500">—</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-white">{formatMoney(customsValue, currency)}</td>
            </tr>
            {lines.map((line) => (
              <tr key={line.key} className={line.preferential ? 'bg-emerald-500/5' : undefined}>
                <td className="px-4 py-2.5">
                  <span className="font-bold text-slate-100">{line.label}</span>
                  {line.preferential ? <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">FTA</span> : null}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{line.basisLabel}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-300">
                  {line.ratePercent !== null ? `${line.ratePercent}%` : line.specific ? `${line.specific.amount}/${line.specific.unit ?? 'unit'}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-white">{formatMoney(line.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-white/10 bg-white/5">
            <tr>
              <td className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400" colSpan={3}>Total duties</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-bold text-white">{formatMoney(totals.duties, currency)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400" colSpan={3}>Total taxes</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-bold text-white">{formatMoney(totals.taxes, currency)}</td>
            </tr>
            <tr className="bg-primary/10">
              <td className="px-4 py-3 text-xs font-black uppercase tracking-widest text-primary" colSpan={3}>
                Landed cost <span className="ml-2 inline-flex items-center gap-1 text-slate-400"><ArrowDownRight className="size-3" />{totals.effectiveDutyRatePercent}% effective duty</span>
              </td>
              <td className="px-4 py-3 text-right text-base font-black tabular-nums text-white">{formatMoney(totals.landedCost, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {notes.length > 0 ? (
        <ul className="space-y-1.5">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-400"><span className="text-primary">•</span>{n}</li>
          ))}
        </ul>
      ) : null}

      <p className="border-t border-white/5 pt-4 text-[11px] leading-relaxed text-slate-500">{disclaimer}</p>
    </div>
  );
}
