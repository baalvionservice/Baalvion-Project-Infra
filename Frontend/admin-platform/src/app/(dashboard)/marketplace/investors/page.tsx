'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, CheckCircle2, XCircle, UserPlus, Ban } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  useMpInvestors,
  useReviewInvestor,
  useMpInvestorInvitations,
  useInviteInvestor,
  useRevokeInvestorInvitation,
} from '@/lib/queries/marketplace.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import {
  MP_LABEL,
  INVESTOR_TYPES,
  type MpInvestor,
  type InvestorStatus,
  type MpInvestorInvitation,
  type InvestorType,
} from '@/lib/types/marketplace.types';

const flag = (s: string, good: string) => s === good ? 'text-green-600 border-green-300' : (s === 'hit' || s === 'failed' || s === 'rejected' ? 'text-red-600 border-red-300' : 'text-amber-600 border-amber-300');

export default function MarketplaceInvestorsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState<InvestorStatus>('submitted');
  const { data, isLoading } = useMpInvestors({ page: 1, limit: 200, status: tab });
  const review = useReviewInvestor();
  const [active, setActive] = useState<MpInvestor | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');

  const { data: invites, isLoading: invitesLoading } = useMpInvestorInvitations({ page: 1, limit: 50, status: 'pending' });
  const inviteInvestor = useInviteInvestor();
  const revokeInvite = useRevokeInvestorInvitation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<InvestorType>('angel');
  const [inviteNote, setInviteNote] = useState('');

  useEffect(() => { setBreadcrumbs([{ label: 'Marketplace', href: '/marketplace/companies' }, { label: 'Investors' }]); }, [setBreadcrumbs]);

  const rows = data?.items ?? [];
  const inviteRows = invites?.items ?? [];
  const open = (i: MpInvestor, a: 'approve' | 'reject') => { setActive(i); setAction(a); setNote(''); };
  const confirm = () => { if (active) review.mutate({ id: active.id, action, note: note.trim() || undefined }, { onSuccess: () => setActive(null) }); };

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteInvestor.mutate(
      { email: inviteEmail.trim(), investorType: inviteType, note: inviteNote.trim() || undefined },
      { onSuccess: () => { setInviteOpen(false); setInviteEmail(''); setInviteNote(''); setInviteType('angel'); } },
    );
  };

  const inviteColumns: ColumnDef<MpInvestorInvitation>[] = [
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-sm font-medium">{row.original.email}</span> },
    { accessorKey: 'investorType', header: 'Invited as', cell: ({ row }) => <Badge variant="outline" className="text-xs">{MP_LABEL(row.original.investorType)}</Badge> },
    { accessorKey: 'invitedBy', header: 'Invited by', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.invitedBy}</span> },
    { accessorKey: 'expiresAt', header: 'Expires', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.expiresAt)}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-destructive"
          disabled={revokeInvite.isPending}
          onClick={() => revokeInvite.mutate(row.original.id)}
        >
          <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke
        </Button>
      ),
    },
  ];

  const columns: ColumnDef<MpInvestor>[] = [
    { accessorKey: 'legal_name', header: ({ column }) => <DataTableColumnHeader column={column} title="Investor" />, cell: ({ row }) => <span className="text-sm font-medium">{row.original.legal_name}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="text-xs">{MP_LABEL(row.original.type)}</Badge> },
    { accessorKey: 'country', header: 'Country', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.country || '—'}</span> },
    { accessorKey: 'kyc_status', header: 'KYC', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${flag(row.original.kyc_status, 'verified')}`}>{MP_LABEL(row.original.kyc_status)}</Badge> },
    { accessorKey: 'aml_status', header: 'AML', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${flag(row.original.aml_status, 'clear')}`}>{MP_LABEL(row.original.aml_status)}</Badge> },
    { accessorKey: 'accreditation_status', header: 'Accreditation', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${flag(row.original.accreditation_status, 'verified')}`}>{MP_LABEL(row.original.accreditation_status)}</Badge> },
    { accessorKey: 'created_at', header: 'Submitted', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at) : '—'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${flag(row.original.status, 'approved')}`}>{MP_LABEL(row.original.status)}</Badge> },
    { id: 'actions', cell: ({ row }) => (row.original.status === 'approved' || row.original.status === 'rejected') ? null : (
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
      <PageHeader
        title="Investors"
        description="Review investor onboarding — KYC, AML and accreditation — and grant access."
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Investor
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as InvestorStatus)} className="mb-4">
        <TabsList>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="legal_name" searchPlaceholder="Search investors..." />

      {(invitesLoading || inviteRows.length > 0) && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Pending invitations</h2>
          <DataTable columns={inviteColumns} data={inviteRows} isLoading={invitesLoading} />
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) { setInviteEmail(''); setInviteNote(''); setInviteType('angel'); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite an investor</DialogTitle>
            <DialogDescription>Sends an onboarding invitation email distinct from the staff/employee invite template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                className="h-8 text-xs"
                type="email"
                placeholder="investor@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Investor type</Label>
              <Select value={inviteType} onValueChange={(v) => setInviteType(v as InvestorType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVESTOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {MP_LABEL(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Personal note (optional)</Label>
              <Textarea
                className="text-xs"
                rows={3}
                placeholder="Included in the invitation email…"
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={inviteInvestor.isPending || !inviteEmail.trim()} onClick={sendInvite}>
              {inviteInvestor.isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Approve investor' : 'Reject investor'}</DialogTitle>
            <DialogDescription>{active && (action === 'approve'
              ? `Grant ${active.legal_name} investor access. KYC, AML and accreditation will be marked cleared/verified.`
              : `Decline ${active.legal_name}.`)}</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                {MP_LABEL(active.type)} · {active.country || '—'} · KYC {MP_LABEL(active.kyc_status)} · AML {MP_LABEL(active.aml_status)} · Accred {MP_LABEL(active.accreditation_status)}
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
