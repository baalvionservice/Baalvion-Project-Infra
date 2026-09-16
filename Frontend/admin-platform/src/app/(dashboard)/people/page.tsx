'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebounced } from '@/lib/hooks/useDebounced';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Globe, Search, ShieldAlert, AlertTriangle, ShieldOff, Clock, Loader2, Boxes } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { usersApi } from '@/lib/api/users';
import { staffApi } from '@/lib/api/staff';
import { useSiteGrantsFor, useRevokeAllSiteAccess } from '@/lib/queries/cms-websites.queries';
import { useChangeUserRole } from '@/lib/queries/users.queries';
import { useAllBusinessGrants, useRevokeBusinessAccess } from '@/lib/queries/business-access.queries';
import type { BusinessGrant } from '@/lib/api/business-access';
import { useAccess } from '@/lib/authz/useAccess';
import { roleLevel, ROLE_HIERARCHY } from '@/lib/authz/hierarchy';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLES } from '@/lib/constants/roles';
import { cmsRoleLabel, CMS_ROLE_TONE } from '@/lib/cms/permissions';
import { initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { AdminUser } from '@/lib/types/user.types';
import type { Employee } from '@/lib/types/staff.types';
import type { SiteGrant } from '@/lib/types/cms-website.types';

const NO_DEPARTMENT = 'Unassigned';

/** A grant inside this window is close enough that someone should decide about it. */
const EXPIRING_SOON_DAYS = 14;

/** Whole days until a grant lapses. Negative when it already has. */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Short, unambiguous phrasing — "in 3 days" beats a bare date for judging urgency. */
function expiryLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return 'expired';
  if (d === 0) return 'expires today';
  if (d === 1) return 'expires tomorrow';
  if (d <= EXPIRING_SOON_DAYS) return `expires in ${d} days`;
  return `expires ${new Date(iso).toLocaleDateString()}`;
}

/** Inline banner for a partial failure — the page still renders, but says what it can't know. */
function Notice({ tone, children }: { tone: 'destructive' | 'warning'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-xs',
        tone === 'destructive'
          ? 'border-destructive/40 bg-destructive/5 text-destructive'
          : 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

interface Person {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: AdminUser['status'];
  platformRole: AdminUser['role'];
  department: string;
  title: string | null;
  grants: SiteGrant[];
  /** Non-CMS access: trade, jobs, IR, … Granted centrally, carried in their token. */
  businesses: BusinessGrant[];
}

/**
 * People — one row per person: who they are, which department they sit in, what authority
 * they hold, and which websites they can actually reach.
 *
 * The staff directory knew departments and the CMS knew site access, but nothing joined them,
 * so "who is in Finance, and what can they open?" was unanswerable. Joined here on user id.
 */
export default function PeoplePage() {
  const { setBreadcrumbs } = useUIStore();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [page, setPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<Person | null>(null);
  const { mutate: revokeAll, isPending: revoking } = useRevokeAllSiteAccess();
  const { mutate: changeRole } = useChangeUserRole();

  // Offer only roles this viewer could actually grant. The server enforces the same rule —
  // this just avoids presenting a choice that would come back 403.
  const { roles: myRoles, principal } = useAccess();
  const currentUserId = useAuthStore((st) => st.user?.id);
  const myRank = useMemo(() => Math.max(-1, ...myRoles.map((r) => roleLevel(r))), [myRoles]);
  const grantableRoles = useMemo(
    () => ROLE_HIERARCHY.filter((r) => roleLevel(r) <= myRank),
    [myRank],
  );

  useEffect(() => {
    setBreadcrumbs([{ label: 'People' }]);
  }, [setBreadcrumbs]);


  const PAGE_SIZE = 50;
  // Debounced so typing doesn't fire a request per keystroke — search runs SERVER-side, so it
  // finds people beyond the current page instead of filtering only what was already fetched.
  const debouncedSearch = useDebounced(search, 300);

  // A new search starts at the beginning; staying on page 7 of the old result set would
  // otherwise show an empty list that looks like "no matches".
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dept]);

  const usersQuery = useQuery({
    queryKey: ['people', 'users', page, debouncedSearch],
    queryFn: () =>
      usersApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev, // keep the current page visible while the next loads
  });

  // The staff directory is bounded by headcount, not by user count, so one generous fetch is
  // reasonable — and it reports truncation rather than silently dropping departments.
  const EMPLOYEE_FETCH_LIMIT = 500;
  const employeesQuery = useQuery({
    queryKey: ['people', 'employees', EMPLOYEE_FETCH_LIMIT],
    queryFn: () => staffApi.listEmployees({ limit: EMPLOYEE_FETCH_LIMIT }).then((r) => r.data),
    staleTime: 60_000,
  });

  const pageUserIds = useMemo(
    () => (usersQuery.data?.data ?? []).map((u) => u.id),
    [usersQuery.data],
  );
  const grantsQuery = useSiteGrantsFor(pageUserIds);
  // Business grants are few enough platform-wide to fetch once and index by user, rather than
  // adding a second per-page round trip.
  const bizQuery = useAllBusinessGrants();
  const { mutate: revokeBusiness } = useRevokeBusinessAccess();

  const users = usersQuery.data?.data;
  const employees = employeesQuery.data?.data;
  const grants = grantsQuery.data;
  const bizGrants = bizQuery.data;

  const isLoading = usersQuery.isLoading || employeesQuery.isLoading || grantsQuery.isLoading || bizQuery.isLoading;

  // Each source is reported separately. A failed grants call must NEVER be allowed to render
  // as "No site access" — on an access screen that reads as a definitive answer rather than a
  // failure, and would hide real access from whoever is auditing it.
  const usersFailed = usersQuery.isError;
  const employeesFailed = employeesQuery.isError;
  const grantsFailed = grantsQuery.isError;
  const businessesFailed = bizQuery.isError;

  const userTotal = usersQuery.data?.pagination?.total ?? 0;
  const totalPages = usersQuery.data?.pagination?.totalPages ?? 1;
  // Departments come from a single staff fetch; say so if it didn't cover everyone.
  const employeeTotal = employeesQuery.data?.pagination?.total ?? 0;
  const employeesTruncated = employeeTotal > EMPLOYEE_FETCH_LIMIT;

  const people = useMemo<Person[]>(() => {
    const empByUser = new Map<string, Employee>();
    (employees ?? []).forEach((e: Employee) => empByUser.set(String(e.userId), e));

    const grantsByUser = new Map<number, SiteGrant[]>();
    (grants ?? []).forEach((g) => {
      const list = grantsByUser.get(g.userId) ?? [];
      list.push(g);
      grantsByUser.set(g.userId, list);
    });

    const bizByUser = new Map<number, BusinessGrant[]>();
    (bizGrants ?? []).forEach((g) => {
      const list = bizByUser.get(g.userId) ?? [];
      list.push(g);
      bizByUser.set(g.userId, list);
    });

    return (users ?? []).map((u) => {
      const emp = empByUser.get(String(u.id));
      return {
        userId: u.id,
        fullName: u.fullName || u.email,
        email: u.email,
        avatarUrl: u.avatarUrl,
        status: u.status,
        platformRole: u.role,
        department: emp?.departmentName || NO_DEPARTMENT,
        title: emp?.title ?? null,
        grants: grantsByUser.get(u.id) ?? [],
        businesses: bizByUser.get(u.id) ?? [],
      };
    });
  }, [users, employees, grants, bizGrants]);

  const departments = useMemo(() => {
    const names = new Set(people.map((p) => p.department));
    // Unassigned always last — it's a gap to fix, not a department.
    return [...names].sort((a, b) =>
      a === NO_DEPARTMENT ? 1 : b === NO_DEPARTMENT ? -1 : a.localeCompare(b),
    );
  }, [people]);

  // Search already happened server-side, so only the department narrowing is applied here —
  // re-filtering by name would throw away rows the server deliberately matched (on email, say).
  const filtered = useMemo(
    () => (dept === 'all' ? people : people.filter((p) => p.department === dept)),
    [people, dept],
  );

  // Grouped by department so the page reads as an org chart, not a flat user dump.
  const grouped = useMemo(() => {
    const map = new Map<string, Person[]>();
    filtered.forEach((p) => {
      const list = map.get(p.department) ?? [];
      list.push(p);
      map.set(p.department, list);
    });
    return [...map.entries()].sort(([a], [b]) =>
      a === NO_DEPARTMENT ? 1 : b === NO_DEPARTMENT ? -1 : a.localeCompare(b),
    );
  }, [filtered]);

  /**
   * Mirrors the server's guards: not yourself, and not someone who outranks you. Shown as a
   * disabled badge rather than a hidden one, so it is clear the role exists and is just not
   * yours to change.
   */
  const canChangeRole = (p: Person) =>
    p.userId !== currentUserId && roleLevel(p.platformRole ?? '') <= myRank;

  // Counts people with NO reach at all. Before business grants existed this only looked at
  // sites, which would now wrongly count a trade operator as having no access.
  const withoutAccess = people.filter((p) => p.grants.length === 0 && p.businesses.length === 0).length;
  // Counted across grants, not people: one person with three lapsing sites is three decisions.
  const expiringSoon = people.reduce(
    (n, p) =>
      n + p.grants.filter((g) => g.expiresAt && daysUntil(g.expiresAt) <= EXPIRING_SOON_DAYS).length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Everyone, their department, their authority, and everything they can reach — sites and businesses"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'People', value: userTotal || people.length, icon: Users },
          { label: 'Departments', value: departments.filter((d) => d !== NO_DEPARTMENT).length, icon: Building2 },
          { label: `Expiring in ${EXPIRING_SOON_DAYS} days`, value: grantsFailed ? '—' : expiringSoon, icon: Clock },
          { label: 'No access anywhere', value: grantsFailed || businessesFailed ? '—' : withoutAccess, icon: ShieldAlert },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xl font-semibold leading-none">{isLoading ? '—' : value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expiringSoon > 0 && !grantsFailed && (
        <Notice tone="warning">
          {expiringSoon} site grant{expiringSoon > 1 ? 's' : ''} lapse
          {expiringSoon > 1 ? '' : 's'} within {EXPIRING_SOON_DAYS} days. Access stops on its own —
          extend it or let it end, but the person is not warned automatically.
        </Notice>
      )}

      {(grantsFailed || employeesFailed || employeesTruncated) && (
        <div className="space-y-2">
          {grantsFailed && (
            <Notice tone="destructive">
              Site access couldn&apos;t be loaded, so the access column is unknown — not empty.
              Don&apos;t read this page as &ldquo;nobody has access&rdquo;.
            </Notice>
          )}
          {employeesFailed && (
            <Notice tone="warning">
              The staff directory couldn&apos;t be loaded, so departments are missing. People and
              their access are still accurate.
            </Notice>
          )}
          {employeesTruncated && (
            <Notice tone="warning">
              Departments were loaded for the first {EMPLOYEE_FETCH_LIMIT} of {employeeTotal}{' '}
              staff records, so some people may show as Unassigned.
            </Notice>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8 text-sm"
            placeholder="Search people, departments, sites…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usersFailed ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Couldn&apos;t load people</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The directory is unavailable, so this page can&apos;t show who has access.
                Nothing here should be treated as a complete picture.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => usersQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {dept === 'all'
              ? 'No one matches that search.'
              : `No one on this page is in ${dept}. Try another page or clear the department filter.`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([department, members]) => (
            <div key={department}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold">{department}</h2>
                <span className="text-xs text-muted-foreground">
                  {members.length} {members.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              <Card>
                <CardContent className="divide-y p-0">
                  {members.map((p) => {
                    const roleConfig = p.platformRole ? ROLES[p.platformRole] : null;
                    return (
                      <div key={p.userId} className="flex flex-wrap items-center gap-3 p-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={p.avatarUrl ?? undefined} alt={p.fullName} />
                          <AvatarFallback className="text-xs">{initials(p.fullName)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.title ? `${p.title} · ` : ''}{p.email}
                          </p>
                        </div>

                        {roleConfig && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={!canChangeRole(p)}>
                              <button
                                className={cn(
                                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity',
                                  roleConfig.color,
                                  canChangeRole(p) ? 'hover:opacity-80' : 'cursor-default',
                                )}
                                title={canChangeRole(p) ? 'Change role' : 'You cannot change this person’s role'}
                              >
                                {roleConfig.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                Change {p.fullName.split(' ')[0]}’s role
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {grantableRoles.map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  disabled={r === p.platformRole}
                                  onClick={() => changeRole({ userId: p.userId, role: r })}
                                >
                                  <span className="flex-1">{ROLES[r as keyof typeof ROLES]?.label ?? r}</span>
                                  {r === p.platformRole && (
                                    <span className="text-[10px] text-muted-foreground">current</span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {grantsFailed ? (
                            <span className="text-xs text-destructive">Access unknown</span>
                          ) : p.grants.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No site access</span>
                          ) : (
                            <>
                              {p.grants.map((g) => (
                                <Badge
                                  key={g.id}
                                  variant="outline"
                                  className={cn('gap-1 text-[10px] font-normal', CMS_ROLE_TONE[g.role])}
                                  title={
                                    `${cmsRoleLabel(g.role)} on ${g.website.domain}` +
                                    (g.expiresAt ? ` · expires ${new Date(g.expiresAt).toLocaleDateString()}` : '')
                                  }
                                >
                                  <Globe className="h-2.5 w-2.5" />
                                  {g.website.name}
                                  <span className="opacity-70">· {cmsRoleLabel(g.role)}</span>
                                  {g.expiresAt && (
                                    <span
                                      className={cn(
                                        'ml-0.5 inline-flex items-center gap-0.5',
                                        daysUntil(g.expiresAt) <= EXPIRING_SOON_DAYS
                                          ? 'font-medium text-amber-600 dark:text-amber-400'
                                          : 'opacity-70',
                                      )}
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      {expiryLabel(g.expiresAt)}
                                    </span>
                                  )}
                                </Badge>
                              ))}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                                onClick={() => setRevokeTarget(p)}
                              >
                                <ShieldOff className="mr-1 h-3 w-3" />
                                Revoke all
                              </Button>
                            </>
                          )}

                          {/* Non-CMS access, shown in the same row: someone's reach across the
                              whole platform is one line, not one screen per product. */}
                          {businessesFailed ? (
                            <span className="text-xs text-destructive">Business access unknown</span>
                          ) : (
                            p.businesses.map((b) => (
                              <Badge
                                key={b.id}
                                variant="outline"
                                className="gap-1 border-violet-500/30 bg-violet-500/10 text-[10px] font-normal text-violet-500"
                                title={
                                  `${b.role} on ${b.business}` +
                                  (b.expiresAt ? ` · expires ${new Date(b.expiresAt).toLocaleDateString()}` : '')
                                }
                              >
                                <Boxes className="h-2.5 w-2.5" />
                                {b.business}
                                <span className="opacity-70">· {b.role}</span>
                                {b.expiresAt && <Clock className="h-2.5 w-2.5 opacity-70" />}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {!usersFailed && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {userTotal} people
            {dept !== 'all' && ' · department filter applies to this page'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || usersQuery.isFetching}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || usersQuery.isFetching}
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all site access?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget && (
                <>
                  <span className="font-medium text-foreground">{revokeTarget.fullName}</span> will
                  lose{' '}
                  {[
                    revokeTarget.grants.length
                      ? `${revokeTarget.grants.length} site${revokeTarget.grants.length > 1 ? 's' : ''}`
                      : null,
                    revokeTarget.businesses.length
                      ? `${revokeTarget.businesses.length} business${revokeTarget.businesses.length > 1 ? 'es' : ''}`
                      : null,
                  ].filter(Boolean).join(' and ')}
                  . Their account stays active — only site access is removed, and every
                  removal is recorded in the audit log.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(e) => {
                // Keep the dialog open until the request settles, so the result is visible.
                e.preventDefault();
                if (!revokeTarget) return;
                const target = revokeTarget;
                // Both halves, or the button's promise is false. Business access is removed
                // first: it is the one that reaches money and operations.
                if (target.businesses.length) revokeBusiness({ userId: target.userId });
                revokeAll(target.userId, { onSettled: () => setRevokeTarget(null) });
              }}
            >
              {revoking && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
