'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Shield, ShieldAlert, ShieldCheck, LogOut, MapPin } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { sessionsApi, type SessionDetail } from '@/lib/api/sessions';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';

const riskBadge = (level: string) => {
  if (level === 'high')   return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> High</Badge>;
  if (level === 'medium') return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Shield className="h-3 w-3" /> Medium</Badge>;
  return <Badge variant="outline" className="gap-1 text-green-600 border-green-500"><ShieldCheck className="h-3 w-3" /> Low</Badge>;
};

export default function SessionsPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState('');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Sessions' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', page, riskFilter],
    queryFn: () =>
      sessionsApi.adminListAll({ page, limit: 25, riskLevel: riskFilter || undefined })
        .then((r) => r.data.data),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.adminRevokeOne(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sessions'] }),
  });

  const columns: ColumnDef<SessionDetail>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium">{(row.original as SessionDetail & { email?: string }).email ?? row.original.user_id}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{row.original.ip_address}</p>
        </div>
      ),
    },
    {
      accessorKey: 'geo',
      header: 'Location',
      cell: ({ row }) => {
        const s = row.original;
        const loc = [s.geo_city, s.geo_country].filter(Boolean).join(', ');
        return loc ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {loc}
          </div>
        ) : <span className="text-xs text-muted-foreground">Unknown</span>;
      },
    },
    {
      accessorKey: 'device',
      header: 'Device',
      cell: ({ row }) => {
        const s = row.original;
        return <span className="text-xs">{[s.device_browser, s.device_os].filter(Boolean).join(' · ') || '—'}</span>;
      },
    },
    {
      accessorKey: 'risk_level',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Risk" />,
      cell: ({ row }) => riskBadge(row.original.risk_level),
    },
    {
      accessorKey: 'last_seen_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Active" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.last_seen_at)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              Revoke
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately terminate the session for {(row.original as SessionDetail & { email?: string }).email ?? row.original.user_id}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => revokeMutation.mutate(row.original.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Active Sessions"
        description="Monitor and manage all platform sessions in real-time"
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchColumn="user"
        searchPlaceholder="Search by IP or user..."
        totalCount={data?.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={riskFilter || '__all__'} onValueChange={(v) => setRiskFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All risks</SelectItem>
              <SelectItem value="high">High risk</SelectItem>
              <SelectItem value="medium">Medium risk</SelectItem>
              <SelectItem value="low">Low risk</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
