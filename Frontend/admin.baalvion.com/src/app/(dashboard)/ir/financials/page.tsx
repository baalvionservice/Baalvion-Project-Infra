'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, ArrowLeft, Send, Pencil, Trash2, FileBarChart } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReports, useDeleteReport, usePublishReport } from '@/lib/queries/ir-reports.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import {
  IR_REPORT_TYPES,
  IR_REPORT_STATUSES,
  IR_REPORT_TYPE_LABELS,
  formatReportPeriod,
  type IrReport,
  type IrReportType,
  type IrReportStatus,
} from '@/lib/types/ir.types';

export default function FinancialReportsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [typeFilter, setTypeFilter] = useState<IrReportType | ''>('');
  const [statusFilter, setStatusFilter] = useState<IrReportStatus | ''>('');

  // The IR list endpoint paginates by page/limit only; type/status filtering is done
  // client-side over a wide fetch (report volumes are small — quarterly/annual cadence).
  const { data, isLoading } = useReports({ page: 1, limit: 100 });
  const { mutate: remove } = useDeleteReport();
  const { mutate: publish, isPending: isPublishing } = usePublishReport();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Investor Relations', href: '/ir' },
      { label: 'Financial Reports' },
    ]);
  }, [setBreadcrumbs]);

  const rows = useMemo(() => {
    let items = data?.items ?? [];
    if (typeFilter) items = items.filter((r) => r.report_type === typeFilter);
    if (statusFilter) items = items.filter((r) => r.status === statusFilter);
    return items;
  }, [data, typeFilter, statusFilter]);

  const columns: ColumnDef<IrReport>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Report" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{formatReportPeriod(row.original)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'report_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {IR_REPORT_TYPE_LABELS[row.original.report_type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'published_at',
      header: 'Published',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.published_at ? formatDate(row.original.published_at) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.updated_at)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/ir/financials/${r.id}`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {r.status !== 'published' && (
                <DropdownMenuItem disabled={isPublishing} onClick={() => publish(r.id)}>
                  <Send className="mr-2 h-4 w-4" /> Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Delete "${r.title}"? This cannot be undone.`)) remove(r.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
        <Link href="/ir">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Investor Relations
        </Link>
      </Button>
      <PageHeader
        title="Financial Reports Center"
        description="Create, upload and publish quarterly, annual, interim and special reports."
        actions={
          <Button size="sm" onClick={() => router.push('/ir/financials/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder="Search reports..."
        filters={
          <div className="flex gap-2">
            <Select value={typeFilter || '__all__'} onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : (v as IrReportType))}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {IR_REPORT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{IR_REPORT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : (v as IrReportStatus))}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {IR_REPORT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
