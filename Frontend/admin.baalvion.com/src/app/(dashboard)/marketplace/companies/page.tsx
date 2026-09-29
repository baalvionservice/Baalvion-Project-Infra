'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, CheckCircle2, XCircle, Clock, Globe } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMpCompanies, useReviewCompany } from '@/lib/queries/marketplace.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { MP_LABEL, type MpCompany, type CompanyStatus } from '@/lib/types/marketplace.types';

const STATUS_CLS: Record<string, string> = {
  draft: 'text-muted-foreground', submitted: 'text-amber-600 border-amber-300',
  approved: 'text-green-600 border-green-300', rejected: 'text-red-600 border-red-300',
  suspended: 'text-red-600 border-red-300',
};

export default function MarketplaceCompaniesPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState<CompanyStatus>('submitted');
  const { data, isLoading } = useMpCompanies({ page: 1, limit: 200, status: tab });
  const review = useReviewCompany();
  const [active, setActive] = useState<MpCompany | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');

  useEffect(() => { setBreadcrumbs([{ label: 'Marketplace', href: '/marketplace/companies' }, { label: 'Companies' }]); }, [setBreadcrumbs]);

  const rows = data?.items ?? [];
  const open = (c: MpCompany, a: 'approve' | 'reject') => { setActive(c); setAction(a); setNote(''); };
  const confirm = () => { if (active) review.mutate({ id: active.id, action, note: note.trim() || undefined }, { onSuccess: () => setActive(null) }); };

  const columns: ColumnDef<MpCompany>[] = [
    { accessorKey: 'legal_name', header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />, cell: ({ row }) => (
      <div><p className="text-sm font-medium">{row.original.brand_name || row.original.legal_name}</p><p className="text-xs text-muted-foreground">{row.original.legal_name}</p></div>) },
    { accessorKey: 'stage', header: 'Stage', cell: ({ row }) => <Badge variant="outline" className="text-xs">{MP_LABEL(row.original.stage)}</Badge> },
    { accessorKey: 'industry_code', header: 'Industry', cell: ({ row }) => <span className="text-sm">{row.original.industry_code || '—'}</span> },
    { accessorKey: 'country', header: 'Country', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.country || '—'}</span> },
    { accessorKey: 'kyc_status', header: 'KYC', cell: ({ row }) => <Badge variant="outline" className="text-xs">{MP_LABEL(row.original.kyc_status)}</Badge> },
    { accessorKey: 'created_at', header: 'Submitted', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at) : '—'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${STATUS_CLS[row.original.status] ?? ''}`}>{MP_LABEL(row.original.status)}</Badge> },
    { id: 'actions', cell: ({ row }) => row.original.status !== 'submitted' ? null : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => open(row.original, 'approve')}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Approve</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => open(row.original, 'reject')}><XCircle className="mr-2 h-4 w-4" /> Reject</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>) },
  ];

  return (
    <div>
      <PageHeader title="Companies" description="Review and approve companies onboarding to raise capital." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as CompanyStatus)} className="mb-4">
        <TabsList>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="legal_name" searchPlaceholder="Search companies..." />

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Approve company' : 'Reject company'}</DialogTitle>
            <DialogDescription>{active && (action === 'approve'
              ? `Approve ${active.brand_name || active.legal_name} to publish funding rounds. KYC will be marked verified.`
              : `Decline ${active.brand_name || active.legal_name}.`)}</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{active.website || '—'}</div>
                <div className="text-xs text-muted-foreground">{MP_LABEL(active.stage)} · {active.industry_code || '—'} · {active.country || '—'}</div>
              </div>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={action === 'approve' ? 'Internal note (optional)…' : 'Reason for declining…'} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>Cancel</Button>
            <Button size="sm" disabled={review.isPending} variant={action === 'reject' ? 'destructive' : 'default'} className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={confirm}>
              {review.isPending ? 'Working…' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
