'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, MoreHorizontal, CheckCircle2, XCircle, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApplications, useReviewApplication } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { LABEL, type InvestorApplication, type ApplicationStatus } from '@/lib/types/ir-modules.types';

const STATUS_BADGE: Record<ApplicationStatus, { variant: 'outline' | 'default' | 'secondary' | 'destructive'; cls: string; icon: typeof Clock }> = {
  pending: { variant: 'outline', cls: 'text-amber-600 border-amber-300', icon: Clock },
  approved: { variant: 'outline', cls: 'text-green-600 border-green-300', icon: CheckCircle2 },
  rejected: { variant: 'outline', cls: 'text-red-600 border-red-300', icon: XCircle },
};

const money = (v?: string | number | null) => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
};

export default function InvestorApplicationsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState<ApplicationStatus>('pending');
  const { data, isLoading } = useApplications({ page: 1, limit: 200, status: tab });
  const review = useReviewApplication();

  const [active, setActive] = useState<InvestorApplication | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Investor Applications' }]);
  }, [setBreadcrumbs]);

  const rows = data?.items ?? [];

  const openReview = (app: InvestorApplication, a: 'approve' | 'reject') => {
    setActive(app); setAction(a); setNote('');
  };

  const confirm = () => {
    if (!active) return;
    review.mutate(
      { id: active.id, action, note: note.trim() || undefined },
      { onSuccess: () => setActive(null) },
    );
  };

  const columns: ColumnDef<InvestorApplication>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applicant" />,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.full_name}</p>
          <a href={`mailto:${row.original.email}`} className="text-xs text-muted-foreground hover:text-primary">{row.original.email}</a>
        </div>
      ),
    },
    { accessorKey: 'entity', header: 'Entity', cell: ({ row }) => <span className="text-sm">{row.original.entity || '—'}</span> },
    { accessorKey: 'investor_type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.investor_type ? LABEL(row.original.investor_type) : '—'}</Badge> },
    {
      accessorKey: 'accredited', header: 'Accredited',
      cell: ({ row }) => row.original.accredited
        ? <Badge variant="outline" className="text-xs text-green-600 border-green-300">Yes</Badge>
        : <Badge variant="outline" className="text-xs text-muted-foreground">No</Badge>,
    },
    { accessorKey: 'commitment', header: ({ column }) => <DataTableColumnHeader column={column} title="Commitment" />, cell: ({ row }) => <span className="text-sm font-medium">{money(row.original.commitment)}</span> },
    { accessorKey: 'reference', header: 'Ref', cell: ({ row }) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.reference}</code> },
    { accessorKey: 'created_at', header: 'Submitted', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at) : '—'}</span> },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.original.status]; const Icon = s.icon;
        return <Badge variant={s.variant} className={`text-xs gap-1 ${s.cls}`}><Icon className="h-3 w-3" />{LABEL(row.original.status)}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => row.original.status !== 'pending' ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openReview(row.original, 'approve')}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Approve</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => openReview(row.original, 'reject')}><XCircle className="mr-2 h-4 w-4" /> Reject</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
        <Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link>
      </Button>
      <PageHeader
        title="Investor Applications"
        description="Review and approve requests for investor access submitted through the public onboarding flow."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ApplicationStatus)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="full_name" searchPlaceholder="Search applicants..." />

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Approve application' : 'Reject application'}</DialogTitle>
            <DialogDescription>
              {active && (
                <>
                  {action === 'approve'
                    ? `Grant ${active.full_name} investor access. They should be notified with secure portal credentials.`
                    : `Decline ${active.full_name}'s request for investor access.`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{active.email}</div>
                <div className="text-xs text-muted-foreground">{active.entity || '—'} · {active.investor_type ? LABEL(active.investor_type) : '—'} · {money(active.commitment)} · {active.accredited ? 'Accredited' : 'Not accredited'}</div>
                {active.message && <p className="pt-1 text-xs italic text-muted-foreground">“{active.message}”</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Note {action === 'reject' ? '(reason)' : '(optional)'}</label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={action === 'approve' ? 'Internal note (optional)…' : 'Reason for declining…'} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={review.isPending}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={action === 'reject' ? 'destructive' : 'default'}
              onClick={confirm}
            >
              {review.isPending ? 'Working…' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
