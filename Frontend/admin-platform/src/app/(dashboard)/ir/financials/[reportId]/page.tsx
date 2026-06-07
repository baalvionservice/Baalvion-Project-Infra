'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ReportUploadField from '@/components/ir/ReportUploadField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useReport,
  useCreateReport,
  useUpdateReport,
  usePublishReport,
} from '@/lib/queries/ir-reports.queries';
import { useUIStore } from '@/lib/store/uiStore';
import {
  IR_REPORT_TYPES,
  IR_REPORT_TYPE_LABELS,
  type IrReportType,
  type CreateReportPayload,
} from '@/lib/types/ir.types';

const CURRENT_YEAR = 2026;

type FormState = {
  title: string;
  report_type: IrReportType;
  period_year: string;
  period_quarter: string; // '' = none
  summary: string;
  highlights: string; // one per line
  revenue: string;
  net_income: string;
  eps: string;
  revenue_growth_pct: string;
  file_url: string | null;
};

const EMPTY: FormState = {
  title: '',
  report_type: 'quarterly',
  period_year: String(CURRENT_YEAR),
  period_quarter: '',
  summary: '',
  highlights: '',
  revenue: '',
  net_income: '',
  eps: '',
  revenue_growth_pct: '',
  file_url: null,
};

// Build the API payload from form state: required fields always, numeric/optional fields
// only when non-empty (the server's zod schema rejects NaN but accepts omitted optionals).
function toPayload(f: FormState): CreateReportPayload {
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  return {
    title: f.title.trim(),
    report_type: f.report_type,
    period_year: Number(f.period_year),
    period_quarter: f.period_quarter ? Number(f.period_quarter) : null,
    summary: f.summary.trim() || undefined,
    highlights: f.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
    revenue: num(f.revenue),
    net_income: num(f.net_income),
    eps: num(f.eps),
    revenue_growth_pct: num(f.revenue_growth_pct),
    file_url: f.file_url || undefined,
  };
}

export default function ReportEditorPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const isNew = reportId === 'new';
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();

  const { data: report, isLoading } = useReport(reportId);
  const create = useCreateReport();
  const update = useUpdateReport(reportId);
  const publish = usePublishReport();

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Investor Relations', href: '/ir' },
      { label: 'Financial Reports', href: '/ir/financials' },
      { label: isNew ? 'New report' : report?.title ?? '…' },
    ]);
  }, [setBreadcrumbs, isNew, report]);

  // Hydrate the form once the report loads (edit mode).
  useEffect(() => {
    if (report) {
      setForm({
        title: report.title,
        report_type: report.report_type,
        period_year: String(report.period_year),
        period_quarter: report.period_quarter ? String(report.period_quarter) : '',
        summary: report.summary ?? '',
        highlights: (report.highlights ?? []).join('\n'),
        revenue: report.revenue != null ? String(report.revenue) : '',
        net_income: report.net_income != null ? String(report.net_income) : '',
        eps: report.eps != null ? String(report.eps) : '',
        revenue_growth_pct: report.revenue_growth_pct != null ? String(report.revenue_growth_pct) : '',
        file_url: report.file_url,
      });
    }
  }, [report]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.title.trim().length > 0 && form.period_year.trim().length > 0;
  const saving = create.isPending || update.isPending;

  const handleSave = () => {
    if (!canSave) {
      toast.error('Title and period year are required');
      return;
    }
    const payload = toPayload(form);
    if (isNew) {
      create.mutate(payload, {
        onSuccess: (created) => router.replace(`/ir/financials/${created.id}`),
      });
    } else {
      update.mutate(payload);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/ir/financials">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Financial Reports
          </Link>
        </Button>
        <PageHeader
          title={isNew ? 'New financial report' : form.title || 'Edit report'}
          description={isNew ? 'Draft a new report — it stays a draft until you publish it.' : undefined}
          actions={
            <div className="flex items-center gap-2">
              {!isNew && report && <StatusBadge status={report.status} />}
              <Button variant="outline" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isNew ? 'Create draft' : 'Save'}
              </Button>
              {!isNew && report && report.status !== 'published' && (
                <Button
                  size="sm"
                  disabled={publish.isPending}
                  onClick={() => publish.mutate(report.id)}
                >
                  {publish.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Publish
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Report details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Q2 FY2026 Results"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.report_type} onValueChange={(v) => set('report_type', v as IrReportType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IR_REPORT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{IR_REPORT_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="year">Fiscal year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={form.period_year}
                    onChange={(e) => set('period_year', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Quarter</Label>
                  <Select value={form.period_quarter || '__none__'} onValueChange={(v) => set('period_quarter', v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (full year)</SelectItem>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  rows={3}
                  placeholder="Short overview shown to investors."
                  value={form.summary}
                  onChange={(e) => set('summary', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="highlights">Key highlights</Label>
                <Textarea
                  id="highlights"
                  rows={4}
                  placeholder={'One highlight per line, e.g.\nRevenue up 18% YoY\nRecord operating margin'}
                  value={form.highlights}
                  onChange={(e) => set('highlights', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">One bullet per line.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Financial metrics</CardTitle>
              <CardDescription className="text-xs">Optional — leave blank if not disclosed.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="revenue">Revenue (USD)</Label>
                <Input id="revenue" type="number" value={form.revenue} onChange={(e) => set('revenue', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="net_income">Net income (USD)</Label>
                <Input id="net_income" type="number" value={form.net_income} onChange={(e) => set('net_income', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eps">EPS</Label>
                <Input id="eps" type="number" step="0.01" value={form.eps} onChange={(e) => set('eps', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="growth">Rev. growth %</Label>
                <Input id="growth" type="number" step="0.1" value={form.revenue_growth_pct} onChange={(e) => set('revenue_growth_pct', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: document */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Report document</CardTitle>
              <CardDescription className="text-xs">The PDF investors download.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportUploadField value={form.file_url} onChange={(url) => set('file_url', url)} />
            </CardContent>
          </Card>

          {!isNew && report && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Current</span>
                  <StatusBadge status={report.status} />
                </div>
                {report.published_at && (
                  <div className="flex items-center justify-between">
                    <span>Published</span>
                    <span>{new Date(report.published_at).toLocaleString()}</span>
                  </div>
                )}
                <p className="pt-2">
                  {report.status === 'published'
                    ? 'This report is live for investors on ir.baalvion.com.'
                    : 'Not yet visible to investors. Use Publish to make it live.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
