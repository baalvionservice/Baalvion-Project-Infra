'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Building2, UserPlus, Mail, CheckCircle2, XCircle,
  Clock, Search, ChevronRight, Shield, AlertTriangle,
  Activity, UserCheck, Layers,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUIStore } from '@/lib/store/uiStore';
import { staffApi } from '@/lib/api/staff';
import { formatRelative, formatDate } from '@/lib/utils/format';
import type { Employee, Department, Team, StaffInvitation, OnboardingChecklist } from '@/lib/types/staff.types';
import { cn } from '@/lib/utils/cn';

// ── Employee row ──────────────────────────────────────────────────────────────

function EmployeeRow({
  employee, onClick, selected,
}: { employee: Employee; onClick: () => void; selected: boolean }) {
  const initials = employee.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const statusColor = {
    active:     'bg-green-500',
    inactive:   'bg-muted-foreground',
    on_leave:   'bg-yellow-500',
    terminated: 'bg-red-500',
  }[employee.status];

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40 px-2 rounded transition-colors',
        selected && 'bg-muted/60',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={employee.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', statusColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{employee.fullName}</p>
        <p className="text-xs text-muted-foreground truncate">{employee.title} · {employee.departmentName}</p>
      </div>
      <div className="shrink-0 text-right">
        <Badge variant="secondary" className="text-[10px] h-4 px-1">{employee.role}</Badge>
        <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(employee.lastActiveAt)}</p>
      </div>
    </div>
  );
}

// ── Employee detail panel ─────────────────────────────────────────────────────

function EmployeeDetail({ employee }: { employee: Employee }) {
  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', employee.id],
    queryFn: () => staffApi.getOnboarding(employee.id).then((r) => r.data.data),
  });
  const { data: permsData } = useQuery({
    queryKey: ['employee-perms', employee.id],
    queryFn: () => staffApi.getIdentityPermissions(employee.id).then((r) => r.data.data),
  });

  const checklist: OnboardingChecklist | undefined = onboarding;
  const initials = employee.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={employee.avatarUrl ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{employee.fullName}</h3>
          <p className="text-sm text-muted-foreground">{employee.title}</p>
          <p className="text-xs text-muted-foreground">{employee.email}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[
          { label: 'Department', value: employee.departmentName },
          { label: 'Team',       value: employee.teamName ?? '—' },
          { label: 'Manager',    value: employee.managerName ?? '—' },
          { label: 'Location',   value: employee.location ?? '—' },
          { label: 'Timezone',   value: employee.timezone },
          { label: 'Hired',      value: formatDate(employee.hiredAt) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-muted-foreground">{label}</p>
            <p className="font-medium truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Onboarding */}
      {checklist && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">Onboarding</p>
            <span className="text-xs text-muted-foreground">{checklist.completionPct}%</span>
          </div>
          <Progress value={checklist.completionPct} className="h-1.5 mb-2" />
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {checklist.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                {step.completed
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  : <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <span className={step.completed ? 'line-through text-muted-foreground' : ''}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      {permsData && (
        <div>
          <p className="text-xs font-medium mb-2">Roles & Permissions</p>
          <div className="flex flex-wrap gap-1">
            {permsData.roles.map((r) => (
              <Badge key={r} variant="secondary" className="text-[10px] h-4 px-1.5">{r}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Department card ───────────────────────────────────────────────────────────

function DepartmentCard({ dept }: { dept: Department }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center shrink-0">
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{dept.name}</p>
        {dept.headName && <p className="text-xs text-muted-foreground">{dept.headName}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{dept.memberCount}</span>
      </div>
    </div>
  );
}

// ── Invitation row ────────────────────────────────────────────────────────────

function InvitationRow({ inv, onRevoke }: { inv: StaffInvitation; onRevoke: (id: string) => void }) {
  const statusIcon = {
    pending:  <Clock className="h-3.5 w-3.5 text-yellow-400" />,
    accepted: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
    expired:  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    revoked:  <XCircle className="h-3.5 w-3.5 text-red-400" />,
  }[inv.status];

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{inv.email}</p>
        <p className="text-xs text-muted-foreground">{inv.role} · {inv.department}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-muted-foreground">{formatRelative(inv.createdAt)}</p>
        {inv.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2 text-red-400 mt-0.5"
            onClick={() => onRevoke(inv.id)}
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const qc = useQueryClient();

  useEffect(() => { setBreadcrumbs([{ label: 'Staff Management' }]); }, [setBreadcrumbs]);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.listDepartments().then((r) => r.data.data),
  });
  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['employees', { search, deptFilter }],
    queryFn: () => staffApi.listEmployees({
      page: 1, limit: 50,
      search: search || undefined,
      departmentId: deptFilter === 'all' ? undefined : deptFilter,
    }).then((r) => r.data.data),
  });
  const { data: invitations, isLoading: invLoading } = useQuery({
    queryKey: ['staff-invitations'],
    queryFn: () => staffApi.listInvitations({ page: 1, limit: 50 }).then((r) => r.data.data),
  });

  const revokeInv = useMutation({
    mutationFn: (id: string) => staffApi.revokeInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-invitations'] }),
  });

  const deptList:  Department[]      = departments ?? [];
  const empList:   Employee[]        = employees?.data ?? [];
  const invList:   StaffInvitation[] = invitations?.data ?? [];

  const activeCount = empList.filter((e) => e.status === 'active').length;
  const pendingInvs = invList.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Employees, departments, teams, invitations, and onboarding"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> Invite Staff
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff',      value: empList.length,   icon: Users,      color: 'text-blue-500'   },
          { label: 'Active',           value: activeCount,      icon: UserCheck,  color: 'text-green-500'  },
          { label: 'Departments',      value: deptList.length,  icon: Building2,  color: 'text-purple-500' },
          { label: 'Pending Invites',  value: pendingInvs,      icon: Mail,       color: pendingInvs > 0 ? 'text-yellow-500' : 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {pendingInvs > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{pendingInvs}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Employees */}
        <TabsContent value="employees">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search staff…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-7 h-7 text-xs"
                      />
                    </div>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue placeholder="Dept" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All depts</SelectItem>
                        {deptList.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto px-2" style={{ maxHeight: 560 }}>
                    {empLoading ? (
                      <div className="space-y-3 p-4">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                      </div>
                    ) : empList.length === 0 ? (
                      <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                        <Users className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No staff found</p>
                      </div>
                    ) : (
                      empList.map((e) => (
                        <EmployeeRow
                          key={e.id}
                          employee={e}
                          selected={selectedEmployee?.id === e.id}
                          onClick={() => setSelectedEmployee(e)}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detail */}
            <div className="lg:col-span-3">
              {selectedEmployee ? (
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium">Employee Profile</CardTitle>
                  </CardHeader>
                  <EmployeeDetail employee={selectedEmployee} />
                </Card>
              ) : (
                <Card className="flex items-center justify-center" style={{ minHeight: 300 }}>
                  <div className="text-center text-muted-foreground py-10">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select an employee to view profile</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Departments
                  </CardTitle>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Layers className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {deptList.length === 0 ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  deptList.map((d) => <DepartmentCard key={d.id} dept={d} />)
                )}
              </CardContent>
            </Card>

            {/* Department distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Headcount by Department</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deptList.map((d) => {
                  const pct = empList.length > 0 ? (d.memberCount / empList.length) * 100 : 0;
                  return (
                    <div key={d.id}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span>{d.name}</span>
                        <span className="text-muted-foreground">{d.memberCount}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invitations */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Staff Invitations
                </CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <UserPlus className="h-3.5 w-3.5" /> Invite
                </Button>
              </div>
              <CardDescription>Pending and historical staff invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {invLoading ? (
                <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : invList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Mail className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No invitations sent</p>
                </div>
              ) : (
                invList.map((inv) => (
                  <InvitationRow key={inv.id} inv={inv} onRevoke={(id) => revokeInv.mutate(id)} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
