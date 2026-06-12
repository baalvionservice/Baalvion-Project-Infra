'use client';

import { useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { useMpOpportunities } from '@/lib/queries/marketplace.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { MP_LABEL, type MpOpportunity } from '@/lib/types/marketplace.types';

const money = (v: string | number | null | undefined) => { const n = Number(v); return v && Number.isFinite(n) ? (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`) : '—'; };
const STATUS: Record<string, string> = { draft: 'text-muted-foreground', live: 'text-green-600 border-green-300', closed: 'text-gray-500' };

export default function MarketplaceOpportunitiesPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useMpOpportunities({ page: 1, limit: 200 });
  useEffect(() => { setBreadcrumbs([{ label: 'Marketplace', href: '/marketplace/companies' }, { label: 'Opportunities' }]); }, [setBreadcrumbs]);
  const rows = data?.items ?? [];

  const columns: ColumnDef<MpOpportunity>[] = [
    { accessorKey: 'title', header: 'Round', cell: ({ row }) => (
      <div><p className="text-sm font-medium">{row.original.title}</p><p className="text-xs text-muted-foreground">{row.original.company?.brand_name || row.original.company?.legal_name || '—'}</p></div>) },
    { accessorKey: 'round', header: 'Stage', cell: ({ row }) => <Badge variant="outline" className="text-xs">{MP_LABEL(row.original.round)}</Badge> },
    { id: 'raising', header: 'Raising', cell: ({ row }) => <span className="text-sm font-medium">{money(row.original.amount_sought)}</span> },
    { id: 'valuation', header: 'Valuation', cell: ({ row }) => <span className="text-sm">{money(row.original.pre_money_valuation)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${STATUS[row.original.status] ?? ''}`}>{MP_LABEL(row.original.status)}</Badge> },
    { accessorKey: 'published_at', header: 'Published', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.published_at ? formatDate(row.original.published_at) : '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Opportunities" description="Funding rounds published by approved companies across the marketplace." />
      <DataTable columns={columns} data={rows} isLoading={isLoading} searchColumn="title" searchPlaceholder="Search rounds..." />
    </div>
  );
}
