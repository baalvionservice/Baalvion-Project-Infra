'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePerformance, useSavePerformance } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';

const METRIC_LABELS: Record<string, string> = { netIRR: 'Net IRR', grossIRR: 'Gross IRR', DPI: 'DPI', TVPI: 'TVPI', RVPI: 'RVPI' };
const isPct = (k: string) => /irr/i.test(k);

export default function PerformancePage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = usePerformance();
  const save = useSavePerformance();
  const [open, setOpen] = useState(false);
  const [metricsText, setMetricsText] = useState('');
  const [navText, setNavText] = useState('');

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Performance' }]); }, [setBreadcrumbs]);

  const metrics = data?.metrics ?? {};
  const navHistory = Array.isArray(data?.navHistory) ? data!.navHistory : [];
  const metricEntries = Object.entries(metrics);

  const openEdit = () => {
    setMetricsText(JSON.stringify(metrics, null, 2));
    setNavText(JSON.stringify(navHistory, null, 2));
    setOpen(true);
  };
  const submit = () => {
    let m: unknown, n: unknown;
    try { m = metricsText.trim() ? JSON.parse(metricsText) : {}; } catch { toast.error('Metrics is not valid JSON'); return; }
    try { n = navText.trim() ? JSON.parse(navText) : []; } catch { toast.error('NAV history is not valid JSON'); return; }
    save.mutate({ metrics: m, navHistory: n }, { onSuccess: () => setOpen(false) });
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link></Button>
      <PageHeader
        title="Performance"
        description="NAV history and fund performance metrics (IRR, DPI, TVPI)."
        actions={<Button size="sm" variant="outline" onClick={openEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : (
        <div className="space-y-6">
          {metricEntries.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {metricEntries.map(([k, v]) => (
                <Card key={k}><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{METRIC_LABELS[k] ?? k}</p>
                  <p className="mt-1 text-2xl font-bold">{typeof v === 'number' ? (isPct(k) ? `${v.toFixed(1)}%` : `${v.toFixed(2)}x`) : String(v)}</p>
                </CardContent></Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">No metrics yet — click Edit to add them.</CardContent></Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-primary" /> NAV history</CardTitle><CardDescription className="text-xs">Net asset value over time.</CardDescription></CardHeader>
            <CardContent>
              {navHistory.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No NAV data points yet.</p> : (
                <div className="divide-y">
                  {navHistory.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-muted-foreground">{p.date ?? p.label ?? `Point ${i + 1}`}</span>
                      <span className="font-medium">{typeof (p.nav ?? p.value) === 'number' ? (p.nav ?? p.value).toLocaleString() : String(p.nav ?? p.value ?? '—')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit performance</DialogTitle>
            <DialogDescription>Metrics as a JSON object; NAV history as a JSON array of {`{ date, nav }`}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Metrics (JSON)</Label><Textarea rows={5} className="font-mono text-xs" value={metricsText} onChange={(e) => setMetricsText(e.target.value)} placeholder={'{\n  "netIRR": 18.5,\n  "TVPI": 1.62\n}'} /></div>
            <div className="space-y-1.5"><Label>NAV history (JSON)</Label><Textarea rows={5} className="font-mono text-xs" value={navText} onChange={(e) => setNavText(e.target.value)} placeholder={'[\n  { "date": "2026-Q1", "nav": 1.42 }\n]'} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={save.isPending} onClick={submit}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
