'use client';

import { useState } from 'react';
import { useLogisticsNetwork, useQuotePreview, useOptimizeRoute, RouteStrategy, RouteCandidate } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Zap, Leaf, Scale, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STRATEGY_META: Record<RouteStrategy, { label: string; icon: typeof DollarSign; color: string }> = {
  cheapest: { label: 'Cheapest', icon: DollarSign, color: 'text-emerald-600' },
  fastest: { label: 'Fastest', icon: Zap, color: 'text-blue-600' },
  balanced: { label: 'Balanced', icon: Scale, color: 'text-purple-600' },
  green: { label: 'Green', icon: Leaf, color: 'text-green-600' },
};

export default function RouteOptimizerPage() {
  const { toast } = useToast();
  const { data: network } = useLogisticsNetwork();
  const preview = useQuotePreview();
  const optimizeRoute = useOptimizeRoute();

  const [form, setForm] = useState({ originCountry: '', destinationCountry: '', weightKg: '1000', strategy: 'balanced' as RouteStrategy });

  const handlePreview = () => {
    preview.mutate({
      request: {
        origin: { country: form.originCountry },
        destination: { country: form.destinationCountry },
        weight_kg: Number(form.weightKg) || 0,
      },
      strategy: form.strategy,
    });
  };

  const handleOptimizeAndPersist = async () => {
    try {
      await optimizeRoute.mutateAsync({
        request: {
          origin: { country: form.originCountry },
          destination: { country: form.destinationCountry },
          weight_kg: Number(form.weightKg) || 0,
        },
        strategy: form.strategy,
      });
      toast({ title: 'Route optimization persisted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Optimization failed', description: e instanceof Error ? e.message : 'Unexpected error.' });
    }
  };

  const result = preview.data;
  const picks: { key: RouteStrategy; route: RouteCandidate | null | undefined }[] = result
    ? [
      { key: 'cheapest', route: result.cheapest },
      { key: 'fastest', route: result.fastest },
      { key: 'balanced', route: result.balanced },
      { key: 'green', route: result.green },
    ]
    : [];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Route Optimizer</h1>
        <p className="text-sm text-muted-foreground">Multi-leg route optimization over the carrier lane network — cheapest, fastest, balanced or green.</p>
      </div>

      <FreightNavTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Lane Network</CardTitle>
          <CardDescription>{network ? `${network.hubs.length} hubs · ${network.carriers.length} carriers · ${network.lane_count} lanes` : 'Loading network…'}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Optimize a Route</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-2"><Label>Origin Country</Label><Input value={form.originCountry} onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value.toUpperCase() }))} placeholder="CN" maxLength={2} /></div>
            <div className="space-y-2"><Label>Destination Country</Label><Input value={form.destinationCountry} onChange={(e) => setForm((f) => ({ ...f, destinationCountry: e.target.value.toUpperCase() }))} placeholder="NL" maxLength={2} /></div>
            <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Primary Strategy</Label>
              <div className="flex gap-1">
                {(Object.keys(STRATEGY_META) as RouteStrategy[]).map((s) => {
                  const meta = STRATEGY_META[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, strategy: s }))}
                      className={cn('flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-[10px] font-bold uppercase', form.strategy === s ? 'border-primary bg-primary/10' : 'border-input')}
                    >
                      <meta.icon className={cn('h-3 w-3', meta.color)} /> {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePreview} disabled={preview.isPending || !form.originCountry || !form.destinationCountry}>
              {preview.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Preview
            </Button>
            <Button variant="outline" onClick={handleOptimizeAndPersist} disabled={optimizeRoute.isPending || !form.originCountry || !form.destinationCountry}>
              {optimizeRoute.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Optimize & Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Strategy Picks</CardTitle></CardHeader>
          <CardContent>
            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {result.warnings.map((w, i) => <Badge key={i} variant="outline" className="text-[9px]">{w.message}</Badge>)}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {picks.map(({ key, route }) => {
                const meta = STRATEGY_META[key];
                return (
                  <Card key={key} className={cn('shadow-none', form.strategy === key && 'border-primary')}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"><meta.icon className={cn('h-3.5 w-3.5', meta.color)} /> {meta.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {route ? (
                        <div className="space-y-1 text-xs">
                          <p className="font-bold flex items-center gap-1">{route.path.join(' → ')}</p>
                          <p>{route.currency} {route.total_cost.toLocaleString()} · {route.total_transit_days}d</p>
                          <p className="text-muted-foreground">{route.co2_kg.toFixed(1)} kg CO₂ · {route.reliability.toFixed(0)}% reliable</p>
                          <p className="text-muted-foreground">{route.hops} leg{route.hops === 1 ? '' : 's'} · {route.modes.join(', ')}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No route available.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {result && result.routes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">All Candidate Routes ({result.routes.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {result.routes.map((route) => (
              <div key={route.id} className="flex items-center justify-between p-3 rounded-lg border text-xs">
                <div className="flex items-center gap-2">
                  {route.path.map((hub, i) => (
                    <span key={i} className="flex items-center gap-2">
                      <span className="font-mono font-bold">{hub}</span>
                      {i < route.path.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{route.currency} {route.total_cost.toLocaleString()}</span>
                  <span>{route.total_transit_days}d</span>
                  <span>{route.co2_kg.toFixed(1)} kg CO₂</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
