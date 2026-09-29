'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { identityAdminApi, type LoginEvent } from '@/lib/api/identity-admin';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime, initials } from '@/lib/utils/format';

/**
 * Sign-in activity per property.
 *
 * The site comes from auth.auth_audit_log.app_id, which auth-service fills from the request
 * Origin. A NULL app_id shows as "Unknown origin" and is a real answer — the request carried no
 * Origin (server-to-server, OAuth callbacks). It is NOT folded into the flagship brand, so rows
 * here never claim a sign-in happened somewhere it did not.
 *
 * Events recorded before that attribution shipped are all unattributed, and cannot be
 * backfilled — the origin was never stored. The banner says so rather than letting a large
 * "Unknown origin" count read as a bug.
 */
export default function LoginActivityPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [site, setSite] = useState('');
  const [event, setEvent] = useState<'' | 'login_success' | 'login_failure'>('');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Sign-in Activity' }]);
  }, [setBreadcrumbs]);

  // Filters reset paging — page 4 of "all sites" is rarely a valid page of one site.
  useEffect(() => { setPage(1); }, [site, event]);

  const { data, isLoading } = useQuery({
    queryKey: ['login-activity', page, site, event],
    queryFn: () =>
      identityAdminApi
        .getLoginActivity({ page, limit: 25, site: site || undefined, event: event || undefined })
        .then((r) => r.data.data),
    // Without this the site cards blank out on every page change, which reads as data loss.
    placeholderData: keepPreviousData,
  });

  const sites = data?.sites ?? [];
  // The value IS the canonical site id from @baalvion/sites (gti, imperialpedia, law, …), or a
  // bare hostname for a property outside the registry. Deliberately not mapped through a label
  // table here: this console has already had to supersede four drifting copies of the site
  // registry, and a fifth in the frontend would drift the same way.
  const label = (s: string | null) => (s === null || s === 'unknown' ? 'Unknown origin' : s);
  const unknown = sites.find((s) => s.site === 'unknown');

  const columns: ColumnDef<LoginEvent>[] = [
    {
      accessorKey: 'user_email',
      header: 'Who',
      cell: ({ row }) => {
        const r = row.original;
        // A failed sign-in for an address that is not an account has no user row to join.
        if (!r.user_id) {
          const attempted = typeof r.metadata?.email === 'string' ? r.metadata.email : null;
          return attempted
            ? <span className="text-xs text-muted-foreground">{attempted} <span className="opacity-60">(no account)</span></span>
            : <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={r.user_avatar ?? undefined} />
              <AvatarFallback className="text-[10px]">{initials(r.user_name ?? r.user_email ?? '?')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium">{r.user_name ?? r.user_email}</p>
              <p className="text-[10px] text-muted-foreground">{r.user_email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'app_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
      cell: ({ row }) => (
        <Badge variant={row.original.app_id ? 'outline' : 'secondary'} className="text-xs">
          {label(row.original.app_id)}
        </Badge>
      ),
    },
    {
      accessorKey: 'event_type',
      header: 'Result',
      cell: ({ row }) => (
        <Badge
          variant={row.original.event_type === 'login_success' ? 'outline' : 'destructive'}
          className="text-xs"
        >
          {row.original.event_type === 'login_success' ? 'Signed in' : 'Failed'}
        </Badge>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.original.ip_address ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sign-in Activity"
        description="Who signed in, and on which website, across every Baalvion property"
      />

      {unknown && unknown.logins > 0 && (
        <p className="mb-4 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Unknown origin</span> means the request
          carried no <code className="rounded bg-muted px-1">Origin</code> header — a
          server-to-server call or an OAuth callback. Sign-ins recorded before per-site
          attribution shipped also land here and cannot be backfilled, because the origin was
          never stored.
        </p>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sites.map((s) => {
          const selected = site === s.site;
          return (
            <Card
              key={s.site}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => setSite(selected ? '' : s.site)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSite(selected ? '' : s.site); }
              }}
              className={`cursor-pointer transition-colors ${selected ? 'border-primary' : 'hover:border-muted-foreground/40'}`}
            >
              <CardContent className="p-4">
                <p className="truncate text-sm font-medium" title={label(s.site)}>{label(s.site)}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{s.logins.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.users.toLocaleString()} {s.users === 1 ? 'person' : 'people'}
                  {s.failures > 0 && <> · {s.failures.toLocaleString()} failed</>}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        totalCount={data?.total}
        page={page}
        onPageChange={setPage}
        filters={
          <div className="flex gap-2">
            <Select value={site || '__all__'} onValueChange={(v) => setSite(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Website" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All websites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.site} value={s.site}>{label(s.site)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={event || '__all__'}
              onValueChange={(v) => setEvent(v === '__all__' ? '' : (v as 'login_success' | 'login_failure'))}
            >
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All results</SelectItem>
                <SelectItem value="login_success">Signed in</SelectItem>
                <SelectItem value="login_failure">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
