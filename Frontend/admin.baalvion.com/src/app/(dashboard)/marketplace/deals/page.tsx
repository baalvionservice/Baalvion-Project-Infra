'use client';

import { useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Landmark, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMpDeals, useReleaseEscrow } from '@/lib/queries/marketplace.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { MP_LABEL, type MpDeal } from '@/lib/types/marketplace.types';

const money = (v: string | number) => { const n = Number(v); return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Number(v).toLocaleString()}`; };
const STATUS: Record<string, string> = {
  open: 'text-blue-600 border-blue-300', dd: 'text-amber-600 border-amber-300', negotiating: 'text-amber-600 border-amber-300',
  term_sheet: 'text-purple-600 border-purple-300', signing: 'text-indigo-600 border-indigo-300',
  funding: 'text-teal-600 border-teal-300', closed: 'text-green-600 border-green-300', withdrawn: 'text-gray-500',
};

export default function MarketplaceDealsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useMpDeals({ page: 1, limit: 200 });
  const release = useReleaseEscrow();
  useEffect(() => { setBreadcrumbs([{ label: 'Marketplace', href: '/marketplace/companies' }, { label: 'Deals' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const columns: ColumnDef<MpDeal>[] = [
    { accessorKey: 'id', header: 'Deal', cell: ({ row }) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.id.slice(0, 8)}</code> },
    { accessorKey: 'status', header: 'Stage', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${STATUS[row.original.status] ?? ''}`}>{MP_LABEL(row.original.status)}</Badge> },
    {
      id: 'escrow', header: 'Escrow',
      cell: ({ row }) => {
        const e = row.original.escrow?.[0];
        if (!e) return <span className="text-xs text-muted-foreground">—</span>;
        return <span className="text-xs">{money(e.amount)} · <span className="capitalize">{e.status}</span></span>;
      },
    },
    { accessorKey: 'created_at', header: 'Opened', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at) : '—'}</span> },
    {
      id: 'actions',
      cell: ({ row }) => {
        const funded = row.original.escrow?.find((e) => e.status === 'funded');
        if (!funded) return null;
        return (
          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" disabled={release.isPending}
            onClick={() => { if (confirm(`Release ${money(funded.amount)} escrow? This closes the deal and updates the cap table.`)) release.mutate({ dealId: row.original.id, escrowId: funded.id }); }}>
            <Landmark className="mr-1.5 h-4 w-4" /> Release escrow
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Deals" description="Monitor every live deal across the marketplace and approve escrow releases." />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        <CheckCircle2 className="h-4 w-4" /> Escrow release is staff-only and irreversible — it transfers funds and issues ownership onto the company&apos;s cap table.
      </div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="status" searchPlaceholder="Search by stage..." />
    </div>
  );
}
