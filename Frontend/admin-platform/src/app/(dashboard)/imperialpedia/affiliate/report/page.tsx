'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Download, Loader2, PlayCircle } from 'lucide-react';

type GroupBy = 'merchant' | 'category' | 'contentType' | 'product';

interface ReportRow {
  groupKey: string;
  clicks: number;
  productCount: number;
  estimatedRevenue: number;
}
interface ReportResult {
  groupBy: GroupBy;
  range: { from: string; to: string };
  rows: ReportRow[];
  totals: { clicks: number; estimatedRevenue: number };
  disclaimer: string;
}

const GROUP_LABELS: Record<GroupBy, string> = {
  merchant: 'Merchant',
  category: 'Category',
  contentType: 'Content Type',
  product: 'Product',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AffiliateReportPage() {
  const { setBreadcrumbs } = useUIStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('merchant');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Affiliate Products', href: '/imperialpedia/affiliate' },
      { label: 'Report' },
    ]);
  }, [setBreadcrumbs]);

  const params = () => ({
    groupBy,
    ...(from ? { from: new Date(from).toISOString() } : {}),
    ...(to ? { to: new Date(to).toISOString() } : {}),
  });

  const run = useMutation({
    mutationFn: () => serviceClients.imperialpedia.get('/affiliate-products/reports/summary', { params: params() }).then((r) => r.data.data as ReportResult),
    onSuccess: (data) => { setError(null); setResult(data); },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const exportFile = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `affiliate-report-${groupBy}-${new Date().toISOString().slice(0, 10)}.json`);
        return;
      }
      const res = await serviceClients.imperialpedia.get('/affiliate-products/reports/summary', {
        params: { ...params(), format: 'csv' },
        responseType: 'blob',
      });
      downloadBlob(res.data as Blob, `affiliate-report-${groupBy}-${new Date().toISOString().slice(0, 10)}.csv`);
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Affiliate Revenue Report" description="Click volume + estimated revenue by merchant, category, or content type." />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Group by</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
                  <SelectItem key={g} value={g}>{GROUP_LABELS[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" className="w-full md:w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" className="w-full md:w-40" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Run report
          </Button>
          {result && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => exportFile.mutate('csv')} disabled={exportFile.isPending}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" onClick={() => exportFile.mutate('json')} disabled={exportFile.isPending}>
                <Download className="mr-2 h-4 w-4" /> JSON
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{result.disclaimer}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total clicks</div>
                <div className="text-3xl font-bold tabular-nums">{result.totals.clicks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Estimated revenue</div>
                <div className="text-3xl font-bold tabular-nums">${result.totals.estimatedRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              {result.rows.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No affiliate clicks in this range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{GROUP_LABELS[result.groupBy]}</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Est. revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row) => (
                      <TableRow key={row.groupKey}>
                        <TableCell className="font-medium">{row.groupKey}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.productCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.clicks}</TableCell>
                        <TableCell className="text-right tabular-nums">${row.estimatedRevenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
