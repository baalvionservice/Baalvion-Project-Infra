'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Download, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import {
  useAuditEvents,
  useVerifyAuditChain,
  useExportAuditCsv,
} from '@/lib/queries/audit-center.queries';
import { useUIStore } from '@/lib/store/uiStore';
import type {
  AuditEvent,
  AuditListParams,
  AuditSeverity,
  AuditOutcome,
} from '@/lib/api/audit-center';
import AuditEventsTable from './AuditEventsTable';

const PAGE_LIMIT = 200;

type TabValue = 'all' | 'rbac' | 'payments' | 'security';

const TAB_VALUES: TabValue[] = ['all', 'rbac', 'payments', 'security'];

const SECURITY_KEYWORDS = ['ownership', 'cross_scope', 'login_failed', 'access_denied'];

// Tabs use CLIENT-SIDE prefix/keyword filtering over the fetched page. Server-side filters
// (severity / outcome / actorId / dates) still narrow what the page returns.
function applyTabFilter(events: AuditEvent[], tab: TabValue): AuditEvent[] {
  switch (tab) {
    case 'rbac':
      return events.filter((e) => e.action.startsWith('rbac.'));
    case 'payments':
      return events.filter((e) => e.action.startsWith('commerce.payment'));
    case 'security':
      return events.filter(
        (e) =>
          e.severity === 'high' ||
          e.severity === 'critical' ||
          SECURITY_KEYWORDS.some((kw) => e.action.includes(kw)),
      );
    default:
      return events;
  }
}

const TAB_LABEL: Record<TabValue, string> = {
  all: 'All',
  rbac: 'RBAC Activity',
  payments: 'Payment Events',
  security: 'Security',
};

function AuditCenter() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = TAB_VALUES.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'all';

  // Draft filter state (form) vs applied filter state (sent to the API on Search).
  const [severity, setSeverity] = useState('');
  const [outcome, setOutcome] = useState('');
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [applied, setApplied] = useState<AuditListParams>({ limit: PAGE_LIMIT });

  const { data, isLoading } = useAuditEvents(applied);
  const verifyChain = useVerifyAuditChain();
  const exportCsv = useExportAuditCsv();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Audit Center' }]);
  }, [setBreadcrumbs]);

  const buildParams = (): AuditListParams => ({
    limit: PAGE_LIMIT,
    severity: (severity || undefined) as AuditSeverity | undefined,
    outcome: (outcome || undefined) as AuditOutcome | undefined,
    action: action.trim() || undefined,
    actorId: actorId.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const handleSearch = () => setApplied(buildParams());

  const allEvents = data?.items ?? [];
  const events = useMemo(() => applyTabFilter(allEvents, activeTab), [allEvents, activeTab]);
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Center"
        description="Immutable, hash-chained record of every privileged action across the platform"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => verifyChain.mutate(undefined)}
              disabled={verifyChain.isPending}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {verifyChain.isPending ? 'Verifying...' : 'Verify integrity'}
            </Button>
            <Button
              size="sm"
              onClick={() => exportCsv.mutate(applied)}
              disabled={exportCsv.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportCsv.isPending ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Severity</label>
            <Select
              value={severity || '__all__'}
              onValueChange={(v) => setSeverity(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Outcome</label>
            <Select
              value={outcome || '__all__'}
              onValueChange={(v) => setOutcome(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All outcomes</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Action</label>
            <Input
              className="h-9 w-48"
              placeholder="e.g. rbac.role.assigned"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Actor ID</label>
            <Input
              className="h-9 w-48"
              placeholder="Actor / user ID"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="datetime-local"
              className="h-9 w-52"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="datetime-local"
              className="h-9 w-52"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <Button size="sm" className="h-9" onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Tabs are URL-driven via ?tab so they stay shareable/bookmarkable and match the sidebar
          nav links. Prefix/keyword filtering happens CLIENT-SIDE over the fetched page. */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {TAB_VALUES.map((t) => (
          <Link
            key={t}
            href={t === 'all' ? '/audit-center' : `/audit-center?tab=${t}`}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeTab === t
                ? 'bg-background text-foreground shadow'
                : 'hover:text-foreground',
            )}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </div>

      <AuditEventsTable events={events} isLoading={isLoading} total={total} />
    </div>
  );
}

function AuditCenterFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function AuditCenterPage() {
  return (
    <Suspense fallback={<AuditCenterFallback />}>
      <AuditCenter />
    </Suspense>
  );
}
