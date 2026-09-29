'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ExternalLink, Plus, Trash2, Save, RotateCcw } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── config shape (mirrors imperialpedia-service world-config) ───────────────
type Kind = 'index' | 'fx' | 'commodity' | 'crypto' | 'yield';
const KINDS: Kind[] = ['index', 'fx', 'commodity', 'crypto', 'yield'];
const GROUPS = ['Americas', 'Europe', 'Asia-Pacific'] as const;

interface IndexRow {
  symbol: string;
  name: string;
  dec: number;
  kind: Kind;
  group?: string | null;
}
interface RegionCfg {
  id: string;
  label: string;
  enabled: boolean;
  indices: IndexRow[];
}
interface WatchRow {
  symbol: string;
  name: string;
}
interface WorldConfig {
  settings: { newsFallback: boolean; refreshSeconds: number };
  watchlist: WatchRow[];
  regions: RegionCfg[];
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_ADMIN_PATH || '/cms/websites/imperialpedia';

export default function WorldControlPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'World Control' }]);
  }, [setBreadcrumbs]);

  const [cfg, setCfg] = useState<WorldConfig | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['world-config'],
    queryFn: () => serviceClients.imperialpedia.get('/world-config').then((r) => r.data),
  });

  useEffect(() => {
    if (data?.data) setCfg(structuredClone(data.data) as WorldConfig);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (config: WorldConfig) =>
      serviceClients.imperialpedia.put('/world-config', { config }).then((r) => r.data),
    onSuccess: () => {
      toast.success('World page configuration saved');
      refetch();
    },
    onError: (e) => toast.error(normalizeError(e as AxiosError).message),
  });

  const regions = cfg?.regions ?? [];
  const [activeRegion, setActiveRegion] = useState<string>('world');
  const activeIdx = useMemo(
    () => Math.max(0, regions.findIndex((r) => r.id === activeRegion)),
    [regions, activeRegion],
  );

  if (isLoading || !cfg) {
    return (
      <div className="space-y-6">
        <PageHeader title="World Control" description="Control the live /world markets & news page." />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ── mutators (immutable) ──────────────────────────────────────────────────
  const patch = (fn: (draft: WorldConfig) => void) => {
    const next = structuredClone(cfg) as WorldConfig;
    fn(next);
    setCfg(next);
  };

  const updIndex = (ri: number, ii: number, p: Partial<IndexRow>) =>
    patch((d) => Object.assign(d.regions[ri].indices[ii], p));
  const addIndex = (ri: number) =>
    patch((d) => d.regions[ri].indices.push({ symbol: '', name: '', dec: 2, kind: 'index', group: null }));
  const delIndex = (ri: number, ii: number) => patch((d) => d.regions[ri].indices.splice(ii, 1));

  const updWatch = (i: number, p: Partial<WatchRow>) => patch((d) => Object.assign(d.watchlist[i], p));
  const addWatch = () => patch((d) => d.watchlist.push({ symbol: '', name: '' }));
  const delWatch = (i: number) => patch((d) => d.watchlist.splice(i, 1));

  const save = () => {
    // Drop empty rows so editors can't accidentally save blank symbols.
    const clean = structuredClone(cfg) as WorldConfig;
    clean.regions.forEach((r) => {
      r.indices = r.indices.filter((x) => x.symbol.trim() && x.name.trim());
    });
    clean.watchlist = clean.watchlist.filter((x) => x.symbol.trim() && x.name.trim());
    mutation.mutate(clean);
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="World Control"
        description="Control everything on the live /world markets & news page — indices, watchlist, news source and regions."
      />

      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="settings">Settings &amp; Regions</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        {/* ── MARKETS (per region indices) ── */}
        <TabsContent value="markets" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRegion(r.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  r.id === (regions[activeIdx]?.id ?? '')
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {r.label}
                {!r.enabled && <span className="ml-1 text-muted-foreground">(off)</span>}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {regions[activeIdx]?.label} — indices &amp; tickers
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => addIndex(activeIdx)}>
                <Plus className="mr-1 h-4 w-4" /> Add row
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Yahoo symbol</th>
                      <th className="py-2 pr-3 font-medium">Display name</th>
                      <th className="py-2 pr-3 font-medium">Decimals</th>
                      <th className="py-2 pr-3 font-medium">Kind</th>
                      <th className="py-2 pr-3 font-medium">Group</th>
                      <th className="py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {regions[activeIdx]?.indices.map((row, ii) => (
                      <tr key={ii} className="border-b last:border-0">
                        <td className="py-1.5 pr-3">
                          <Input
                            value={row.symbol}
                            onChange={(e) => updIndex(activeIdx, ii, { symbol: e.target.value })}
                            placeholder="^GSPC"
                            className="h-8 font-mono text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-3">
                          <Input
                            value={row.name}
                            onChange={(e) => updIndex(activeIdx, ii, { name: e.target.value })}
                            placeholder="S&P 500"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-3 w-20">
                          <Input
                            type="number"
                            min={0}
                            max={6}
                            value={row.dec}
                            onChange={(e) => updIndex(activeIdx, ii, { dec: Number(e.target.value) })}
                            className="h-8 w-16 text-xs"
                          />
                        </td>
                        <td className="py-1.5 pr-3">
                          <Select
                            value={row.kind}
                            onValueChange={(v) => updIndex(activeIdx, ii, { kind: v as Kind })}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KINDS.map((k) => (
                                <SelectItem key={k} value={k} className="text-xs">
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 pr-3">
                          <Select
                            value={row.group ?? 'none'}
                            onValueChange={(v) =>
                              updIndex(activeIdx, ii, { group: v === 'none' ? null : v })
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                —
                              </SelectItem>
                              {GROUPS.map((g) => (
                                <SelectItem key={g} value={g} className="text-xs">
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => delIndex(activeIdx, ii)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Symbols use Yahoo Finance format — indices start with <code>^</code> (e.g.{' '}
                <code>^GSPC</code>, <code>^FTSE</code>), FX is <code>EURUSD=X</code>, commodities{' '}
                <code>GC=F</code>, crypto <code>BTC-USD</code>. <strong>Group</strong> only affects
                the World view (Americas / Europe / Asia-Pacific buckets in the markets panel).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WATCHLIST ── */}
        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Watchlist tickers</CardTitle>
              <Button size="sm" variant="outline" onClick={addWatch}>
                <Plus className="mr-1 h-4 w-4" /> Add ticker
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl space-y-2">
                {cfg.watchlist.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={w.symbol}
                      onChange={(e) => updWatch(i, { symbol: e.target.value })}
                      placeholder="AAPL"
                      className="h-8 w-32 font-mono text-xs"
                    />
                    <Input
                      value={w.name}
                      onChange={(e) => updWatch(i, { name: e.target.value })}
                      placeholder="Apple"
                      className="h-8 flex-1 text-xs"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => delWatch(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {cfg.watchlist.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tickers — add some above.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SETTINGS & REGIONS ── */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feed settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between max-w-xl">
                <div>
                  <Label>Wire-service fallback</Label>
                  <p className="text-xs text-muted-foreground">
                    When ON, the page shows Google News headlines if the CMS has no World content
                    yet. Turn OFF to show only content you publish in the CMS.
                  </p>
                </div>
                <Switch
                  checked={cfg.settings.newsFallback}
                  onCheckedChange={(v) => patch((d) => (d.settings.newsFallback = v))}
                />
              </div>
              <div className="flex items-center justify-between max-w-xl">
                <div>
                  <Label>Refresh target (seconds)</Label>
                  <p className="text-xs text-muted-foreground">
                    How often the page revalidates live markets/news.
                  </p>
                </div>
                <Input
                  type="number"
                  min={30}
                  max={3600}
                  value={cfg.settings.refreshSeconds}
                  onChange={(e) => patch((d) => (d.settings.refreshSeconds = Number(e.target.value)))}
                  className="h-9 w-24"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {regions.map((r, ri) => (
                <div key={r.id} className="flex items-center gap-3 border-b py-2 last:border-0">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => patch((d) => (d.regions[ri].enabled = v))}
                  />
                  <Input
                    value={r.label}
                    onChange={(e) => patch((d) => (d.regions[ri].label = e.target.value))}
                    className="h-8 w-48 text-sm"
                  />
                  <span className="font-mono text-xs text-muted-foreground">/world/{r.id}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.indices.length} indices
                  </span>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Disabling a region hides its tab on the live page. (The page itself stays reachable
                so existing links/SEO don&apos;t 404.)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NEWS ── */}
        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">News is controlled in the CMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                The World page hero, “Latest” rail and topic sections are driven by content you
                publish in the CMS. Publish a <strong>news</strong> or <strong>article</strong> and
                it appears automatically (newest first).
              </p>
              <p className="text-muted-foreground">
                To target a specific region, create a <strong>Category</strong> whose slug matches
                the region id (<code>us</code>, <code>europe</code>, <code>asia</code>,{' '}
                <code>china</code>, <code>emerging</code>) and assign your content to it.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={CMS_URL}>
                  Open Imperialpedia CMS <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 px-6 py-3 backdrop-blur lg:left-[var(--sidebar-width,16rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => data?.data && setCfg(structuredClone(data.data) as WorldConfig)}
            disabled={mutation.isPending}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button size="sm" onClick={save} disabled={mutation.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {mutation.isPending ? 'Saving…' : 'Save & publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
