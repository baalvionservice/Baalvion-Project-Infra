'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarket, useSaveMarket, useRefreshMarket } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';

const FIELDS: { key: string; label: string; step?: string }[] = [
  { key: 'symbol', label: 'Ticker symbol' },
  { key: 'exchange', label: 'Exchange' },
  { key: 'currency', label: 'Currency' },
  { key: 'price', label: 'Price', step: '0.01' },
  { key: 'change_pct', label: 'Change %', step: '0.01' },
  { key: 'market_cap', label: 'Market cap', step: '1' },
  { key: 'volume', label: 'Volume', step: '1' },
  { key: 'week52_high', label: '52-week high', step: '0.01' },
  { key: 'week52_low', label: '52-week low', step: '0.01' },
  { key: 'pe_ratio', label: 'P/E ratio', step: '0.01' },
  { key: 'dividend_yield', label: 'Dividend yield %', step: '0.01' },
  { key: 'dividend_per_share', label: 'Dividend / share', step: '0.01' },
];
const NUMERIC = new Set(['price', 'change_pct', 'market_cap', 'volume', 'week52_high', 'week52_low', 'pe_ratio', 'dividend_yield', 'dividend_per_share']);

export default function MarketPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useMarket();
  const save = useSaveMarket();
  const refresh = useRefreshMarket();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Stock & Market' }]); }, [setBreadcrumbs]);
  useEffect(() => {
    if (data) {
      const f: Record<string, string> = {};
      for (const { key } of FIELDS) { const v = (data as any)[key]; f[key] = v == null ? '' : String(v); }
      setForm(f);
    }
  }, [data]);

  const submit = () => {
    const body: Record<string, unknown> = {};
    for (const { key } of FIELDS) {
      const raw = form[key]?.trim();
      if (!raw) continue;
      body[key] = NUMERIC.has(key) ? Number(raw) : raw;
    }
    save.mutate(body);
  };

  const price = Number(form.price) || 0;
  const change = Number(form.change_pct) || 0;
  const up = change >= 0;

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link></Button>
      <PageHeader
        title="Stock & Market"
        description="Manually maintained stock/market snapshot shown in investor widgets. (Swap to a live feed later — no UI change.)"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={refresh.isPending} onClick={() => refresh.mutate()} title="Pull the latest quote from the configured live feed">
              {refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh from feed
            </Button>
            <Button size="sm" disabled={save.isPending} onClick={submit}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
          </div>
        }
      />

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Snapshot fields</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  <Input type={NUMERIC.has(f.key) ? 'number' : 'text'} step={f.step} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live preview of the public widget */}
          <Card className="h-fit">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Widget preview</CardTitle><CardDescription className="text-xs">How investors see it.</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{form.symbol || '—'}</span>
                  <span className="text-xs text-muted-foreground">{form.exchange}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{price ? price.toLocaleString(undefined, { style: 'currency', currency: form.currency || 'USD' }) : '—'}</span>
                  <span className={`flex items-center gap-0.5 text-sm ${up ? 'text-green-600' : 'text-red-600'}`}>
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{change ? `${change.toFixed(2)}%` : ''}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>52W H: {form.week52_high || '—'}</span><span>52W L: {form.week52_low || '—'}</span>
                  <span>P/E: {form.pe_ratio || '—'}</span><span>Yield: {form.dividend_yield ? `${form.dividend_yield}%` : '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
