'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck, Key, Shield, Lock, RotateCcw, AlertTriangle,
  ChevronRight, Eye, EyeOff, Plus, RefreshCw, CheckCircle2,
  XCircle, Fingerprint, Globe, Clock, Activity, Smartphone,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/lib/store/uiStore';
import { identityApi } from '@/lib/api/identity';
import { identityAdminApi } from '@/lib/api/identity-admin';
import { formatDateTime, formatRelative } from '@/lib/utils/format';
import type { RbacRole, JwksKey, RiskEvent, ApiKey } from '@/lib/types/identity.types';
import { cn } from '@/lib/utils/cn';

// ── Risk event row ────────────────────────────────────────────────────────────

function RiskEventRow({ event, onResolve }: { event: RiskEvent; onResolve: (id: string) => void }) {
  const severityColor = {
    low:      'text-blue-400 bg-blue-500/10',
    medium:   'text-yellow-400 bg-yellow-500/10',
    high:     'text-orange-400 bg-orange-500/10',
    critical: 'text-red-400 bg-red-500/10',
  }[event.severity];

  const typeLabel = event.type.replace(/_/g, ' ');

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={cn('mt-0.5 rounded-full p-1.5 shrink-0', severityColor)}>
        <AlertTriangle className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium capitalize">{typeLabel}</span>
          <Badge variant="outline" className={cn('text-[10px] h-4 px-1', severityColor)}>
            {event.severity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{event.userEmail}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{event.country} · {event.ip}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelative(event.createdAt)}</span>
        </div>
      </div>
      {!event.resolvedAt && (
        <Button variant="ghost" size="sm" className="shrink-0 text-xs h-7" onClick={() => onResolve(event.id)}>
          Resolve
        </Button>
      )}
      {event.resolvedAt && (
        <Badge variant="outline" className="text-green-500 border-green-500 text-[10px] shrink-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />Resolved
        </Badge>
      )}
    </div>
  );
}

// ── RBAC role card ────────────────────────────────────────────────────────────

function RoleCard({ role }: { role: RbacRole }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Shield className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{role.displayName}</span>
          {role.isSystem && <Badge variant="secondary" className="text-[10px] h-4 px-1">System</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{role.description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <UserCheck className="h-3 w-3" />{role.memberCount} members
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" />{role.permissions.length} perms
        </span>
      </div>
    </div>
  );
}

// ── JWKS key row ──────────────────────────────────────────────────────────────

function JwksKeyRow({ jwk, onRetire }: { jwk: JwksKey; onRetire: (kid: string) => void }) {
  const [showKid, setShowKid] = useState(false);
  const statusColor = jwk.status === 'active' ? 'text-green-500 border-green-500' :
    jwk.status === 'retiring' ? 'text-yellow-500 border-yellow-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 font-mono text-xs">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('text-[10px] uppercase font-semibold', statusColor)}>{jwk.status}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1">{jwk.alg}</Badge>
          <Badge variant="outline" className="text-[10px] h-4 px-1">{jwk.kty}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span>kid:</span>
          <span className={cn('transition-all', !showKid && 'blur-sm select-none')}>
            {jwk.kid.substring(0, 16)}…
          </span>
          <button onClick={() => setShowKid((v) => !v)} className="text-muted-foreground hover:text-foreground">
            {showKid ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(jwk.createdAt)}</p>
      </div>
      {jwk.status === 'active' && (
        <Button variant="ghost" size="sm" className="text-xs h-7 text-yellow-500" onClick={() => onRetire(jwk.kid)}>
          Retire
        </Button>
      )}
    </div>
  );
}

// ── API Key row ───────────────────────────────────────────────────────────────

function ApiKeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const statusColor = apiKey.status === 'active' ? 'text-green-500 border-green-500' : 'text-muted-foreground';
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{apiKey.name}</span>
          <Badge variant="outline" className={cn('text-[10px] h-4 px-1', statusColor)}>{apiKey.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{apiKey.keyPrefix}••••••••</p>
        <div className="flex gap-2 flex-wrap mt-1">
          {apiKey.scopes.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] h-4 px-1">{s}</Badge>
          ))}
          {apiKey.scopes.length > 4 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">+{apiKey.scopes.length - 4}</Badge>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-muted-foreground">
          {apiKey.lastUsedAt ? `Used ${formatRelative(apiKey.lastUsedAt)}` : 'Never used'}
        </p>
        {apiKey.status === 'active' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-red-500 mt-1"
            onClick={() => onRevoke(apiKey.id)}
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IdentityPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('risk');
  const [searchKey, setSearchKey] = useState('');
  const qc = useQueryClient();

  useEffect(() => { setBreadcrumbs([{ label: 'Identity Command Center' }]); }, [setBreadcrumbs]);

  const { data: stats }         = useQuery({ queryKey: ['identity-stats'], queryFn: () => identityAdminApi.getStats().then((r) => r.data.data), refetchInterval: 30_000 });
  const { data: riskData, isLoading: riskLoading } = useQuery({ queryKey: ['risk-events', { resolved: false }], queryFn: () => identityApi.listRiskEvents({ page: 1, limit: 30, resolved: false }).then((r) => r.data.data) });
  const { data: rolesData, isLoading: rolesLoading } = useQuery({ queryKey: ['rbac-roles'], queryFn: () => identityApi.listRoles().then((r) => r.data.data) });
  // Signing Keys (JWKS) and API Keys have NO backend yet — these calls error. We mark
  // the queries non-retrying so the tabs can render an honest "not yet available" state
  // instead of an indefinite loading skeleton (which would imply data is coming).
  const { data: jwksData, isError: jwksError, isLoading: jwksLoading } = useQuery({ queryKey: ['jwks-keys'], queryFn: () => identityApi.listJwksKeys().then((r) => r.data.data), retry: false });
  const { data: apiKeysData, isError: apiKeysError, isLoading: apiKeysLoading } = useQuery({ queryKey: ['api-keys', { search: searchKey }], queryFn: () => identityApi.listApiKeys({ page: 1, limit: 20 }).then((r) => r.data.data), retry: false });

  const resolveRisk = useMutation({
    mutationFn: (id: string) => identityApi.resolveRiskEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk-events'] }),
  });

  const rotateKey = useMutation({
    mutationFn: () => identityApi.rotateSigningKey(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jwks-keys'] }),
  });

  const retireKey = useMutation({
    mutationFn: (kid: string) => identityApi.retireKey(kid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jwks-keys'] }),
  });

  const revokeApiKey = useMutation({
    mutationFn: (id: string) => identityApi.revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const riskEvents: RiskEvent[] = riskData?.data ?? [];
  const roles: RbacRole[]       = rolesData ?? [];
  const jwksKeys: JwksKey[]     = jwksData ?? [];
  const apiKeys: ApiKey[]       = apiKeysData?.data ?? [];

  const criticalRisk = riskEvents.filter((e) => e.severity === 'critical').length;
  const highRisk     = riskEvents.filter((e) => e.severity === 'high').length;
  const activeKeys   = jwksKeys.filter((k) => k.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity Command Center"
        description="RBAC, API keys, signing keys, SSO, MFA, and risk management"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
              <Activity className="h-3 w-3" /> Live
            </Badge>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',        value: stats?.users?.total ?? '—',   icon: UserCheck,    color: 'text-blue-500'   },
          { label: 'Active Sessions',    value: stats?.activeSessions ?? '—', icon: Smartphone,   color: 'text-green-500'  },
          { label: 'Unresolved Risks',   value: riskEvents.length,            icon: AlertTriangle, color: criticalRisk > 0 ? 'text-red-500' : 'text-orange-500' },
          { label: 'Signing Keys',       value: activeKeys,                   icon: Key,           color: 'text-purple-500' },
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

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="risk">
            Risk Events
            {(criticalRisk + highRisk) > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{criticalRisk + highRisk}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">RBAC Roles</TabsTrigger>
          <TabsTrigger value="keys">Signing Keys</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
        </TabsList>

        {/* Risk Events */}
        <TabsContent value="risk">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Active Risk Events
                  {riskEvents.length > 0 && <Badge variant="destructive" className="ml-auto">{riskEvents.length}</Badge>}
                </CardTitle>
                <CardDescription>Unresolved anomalies requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : riskEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <p className="text-sm">No active risk events</p>
                  </div>
                ) : (
                  <div>{riskEvents.map((e) => <RiskEventRow key={e.id} event={e} onResolve={(id) => resolveRisk.mutate(id)} />)}</div>
                )}
              </CardContent>
            </Card>

            {/* Risk summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                    const count = riskEvents.filter((e) => e.severity === sev).length;
                    const pct = riskEvents.length ? Math.round((count / riskEvents.length) * 100) : 0;
                    const barColor = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' }[sev];
                    return (
                      <div key={sev} className="flex items-center gap-3">
                        <span className="text-xs capitalize w-16 shrink-0">{sev}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {(['impossible_travel', 'brute_force', 'credential_stuffing', 'token_reuse', 'geo_anomaly'] as const).map((type) => {
                    const count = riskEvents.filter((e) => e.type === type).length;
                    return (
                      <div key={type} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <span className="text-xs capitalize">{type.replace(/_/g, ' ')}</span>
                        <Badge variant={count > 0 ? 'destructive' : 'secondary'} className="text-[10px] h-4 px-1">{count}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* RBAC Roles */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Roles & Permissions
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create Role
                </Button>
              </div>
              <CardDescription>Platform RBAC roles and their permission grants</CardDescription>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Shield className="h-8 w-8" />
                  <p className="text-sm">No roles defined</p>
                </div>
              ) : (
                <div>{roles.map((r) => <RoleCard key={r.id} role={r} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signing Keys */}
        <TabsContent value="keys">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" /> JWT Signing Keys (JWKS)
                  </CardTitle>
                  <CardDescription>Manage active and retiring signing keys</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => rotateKey.mutate()}
                  disabled={rotateKey.isPending || jwksError}
                >
                  <RotateCcw className={cn('h-3.5 w-3.5', rotateKey.isPending && 'animate-spin')} />
                  Rotate Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jwksLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : jwksError ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center text-muted-foreground">
                  <Key className="h-8 w-8" />
                  <p className="text-sm font-medium">Signing key management not yet available</p>
                  <p className="text-xs max-w-md">No JWKS management endpoint is wired up in this console yet. Keys are managed directly by the auth service.</p>
                </div>
              ) : jwksKeys.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Key className="h-8 w-8" />
                  <p className="text-sm">No signing keys</p>
                </div>
              ) : (
                <>
                  <div>{jwksKeys.map((k) => <JwksKeyRow key={k.kid} jwk={k} onRetire={(kid) => retireKey.mutate(kid)} />)}</div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Keys in <strong>retiring</strong> state are still accepted for 24h to allow token drain. Retired keys reject all tokens.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" /> Platform API Keys
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search keys…"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    className="h-7 text-xs w-40"
                  />
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Issue Key
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : apiKeysError ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center text-muted-foreground">
                  <Fingerprint className="h-8 w-8" />
                  <p className="text-sm font-medium">API key management not yet available</p>
                  <p className="text-xs max-w-md">No API-key service is wired up in this console yet.</p>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Fingerprint className="h-8 w-8" />
                  <p className="text-sm">No API keys issued</p>
                </div>
              ) : (
                <div>{apiKeys.map((k) => <ApiKeyRow key={k.id} apiKey={k} onRevoke={(id) => revokeApiKey.mutate(id)} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
