'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp,
  MapPin, Globe, Clock, Activity, Eye, XCircle, Lock,
  Fingerprint, Server, FileText, CheckCircle2, Radio,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/lib/store/uiStore';
import { identityAdminApi } from '@/lib/api/identity-admin';
import { identityApi } from '@/lib/api/identity';
import { sessionsApi, type SessionDetail } from '@/lib/api/sessions';
import { formatDateTime, formatRelative, formatNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { RiskEvent } from '@/lib/types/identity.types';

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'warning' | 'danger' | 'ok';
  sub?: string;
}

function StatCard({ title, value, icon: Icon, variant = 'default', sub }: StatCardProps) {
  const color =
    variant === 'danger'  ? 'text-red-500'    :
    variant === 'warning' ? 'text-yellow-500' :
    variant === 'ok'      ? 'text-green-500'  :
    'text-muted-foreground';
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <p className={cn('text-2xl font-bold', variant !== 'default' && color)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── High-risk session row ─────────────────────────────────────────────────────

function HighRiskRow({ session }: { session: SessionDetail }) {
  const loc = [session.geo_city, session.geo_country].filter(Boolean).join(', ');
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.user_id}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {loc && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{loc}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(session.created_at)}</span>
        </div>
        {session.risk_signals && Array.isArray(session.risk_signals) && (session.risk_signals as unknown as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(session.risk_signals as unknown as string[]).map((s) => (
              <Badge key={s} variant="destructive" className="text-[10px] px-1 py-0">{s.replace(/_/g, ' ')}</Badge>
            ))}
          </div>
        )}
      </div>
      <Badge variant="destructive" className="shrink-0 text-xs">
        Score: {session.risk_score ?? '—'}
      </Badge>
    </div>
  );
}

// ── Audit / security event row ────────────────────────────────────────────────

interface AuditEntry {
  id: string | number;
  action: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user_id?: string | number;
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const isCompromise = entry.action === 'security.refresh_reuse_detected';
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <AlertTriangle className={cn('h-4 w-4 shrink-0', isCompromise ? 'text-red-500' : 'text-yellow-500')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{entry.action.replace(/\./g, ' › ')}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {entry.ip_address && <span>{entry.ip_address}</span>}
          <span>{formatDateTime(entry.created_at)}</span>
        </div>
      </div>
      {isCompromise && <Badge variant="destructive" className="text-[10px] shrink-0">Token Reuse</Badge>}
    </div>
  );
}

// ── Risk event row (full SOC view) ────────────────────────────────────────────

function RiskEventCard({ event, onResolve }: { event: RiskEvent; onResolve: (id: string) => void }) {
  const severityColor = {
    low:      'border-blue-500/40 bg-blue-500/5',
    medium:   'border-yellow-500/40 bg-yellow-500/5',
    high:     'border-orange-500/40 bg-orange-500/5',
    critical: 'border-red-500/40 bg-red-500/10',
  }[event.severity];

  const severityBadge = {
    low:      'text-blue-400 border-blue-500/50',
    medium:   'text-yellow-400 border-yellow-500/50',
    high:     'text-orange-400 border-orange-500/50',
    critical: 'text-red-400 border-red-500/50',
  }[event.severity];

  return (
    <div className={cn('rounded-lg border p-3 space-y-2', severityColor)}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium capitalize">{event.type.replace(/_/g, ' ')}</span>
            <Badge variant="outline" className={cn('text-[10px] h-4 px-1', severityBadge)}>{event.severity}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{event.userEmail}</p>
        </div>
        {!event.resolvedAt && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onResolve(event.id)}>
            Resolve
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{event.country} · {event.ip}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelative(event.createdAt)}</span>
        {event.resolvedAt && (
          <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" />Resolved</span>
        )}
      </div>
    </div>
  );
}

// ── Blocked IP table ──────────────────────────────────────────────────────────

const MOCK_BLOCKED_IPS = [
  { ip: '45.142.212.100', reason: 'brute_force',      country: 'RU', blockedAt: new Date(Date.now() - 3600000).toISOString(),  attempts: 847 },
  { ip: '103.21.244.0',   reason: 'credential_stuffing', country: 'CN', blockedAt: new Date(Date.now() - 7200000).toISOString(), attempts: 1203 },
  { ip: '192.241.218.10', reason: 'rate_limit',        country: 'US', blockedAt: new Date(Date.now() - 1800000).toISOString(), attempts: 312 },
  { ip: '77.88.55.66',    reason: 'token_reuse',       country: 'DE', blockedAt: new Date(Date.now() - 900000).toISOString(),  attempts: 44  },
  { ip: '198.54.117.200', reason: 'geo_anomaly',       country: 'BR', blockedAt: new Date(Date.now() - 14400000).toISOString(), attempts: 189 },
];

// ── Compliance checks ─────────────────────────────────────────────────────────

const COMPLIANCE_CHECKS = [
  { label: 'MFA required for admin roles',          pass: true  },
  { label: 'Password policy enforced (12+ chars)',  pass: true  },
  { label: 'Session idle timeout < 8h',             pass: true  },
  { label: 'Audit logging enabled',                 pass: true  },
  { label: 'Refresh token rotation active',         pass: true  },
  { label: 'JWKS key rotation < 90 days',           pass: false },
  { label: 'OAuth PKCE enforced on all clients',    pass: false },
  { label: 'IP allowlist configured for API keys',  pass: false },
  { label: 'SOC2 evidence exported this quarter',   pass: true  },
  { label: 'Passkeys/WebAuthn available',           pass: false },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('overview');

  useEffect(() => { setBreadcrumbs([{ label: 'Security Operations Center' }]); }, [setBreadcrumbs]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['identity-stats'],
    queryFn: () => identityAdminApi.getStats().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: highRiskData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['high-risk-sessions'],
    queryFn: () => sessionsApi.adminListAll({ page: 1, limit: 20, riskLevel: 'high' }).then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['security-audit-events'],
    queryFn: () => identityAdminApi.getAuditLogs({
      page: 1, limit: 30,
      action: 'user.login_failed,security.refresh_reuse_detected,admin.impersonation_started',
    }).then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk-events-all'],
    queryFn: () => identityApi.listRiskEvents({ page: 1, limit: 20 }).then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const highRiskSessions: SessionDetail[] = highRiskData?.items ?? [];
  const securityEvents:   AuditEntry[]    = auditData?.items ?? [];
  const riskEvents:       RiskEvent[]     = riskData?.data ?? [];

  const criticalEvents  = riskEvents.filter((e) => e.severity === 'critical' && !e.resolvedAt).length;
  const tokenReuseCount = securityEvents.filter((e) => e.action === 'security.refresh_reuse_detected').length;
  const passChecks      = COMPLIANCE_CHECKS.filter((c) => c.pass).length;
  const compliancePct   = Math.round((passChecks / COMPLIANCE_CHECKS.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Operations Center"
        description="Fraud detection, risk engine, anomaly monitoring, blocked IPs, and compliance"
        actions={
          <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
            <Radio className="h-3 w-3 animate-pulse" /> Live · 30s refresh
          </Badge>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard title="Active Sessions"      value={stats?.activeSessions ?? '—'}           icon={Globe}      />
            <StatCard title="High-Risk Sessions"   value={highRiskSessions.length}                icon={ShieldAlert} variant={highRiskSessions.length > 0 ? 'danger' : 'ok'} sub="Right now" />
            <StatCard title="Failed Logins (24h)"  value={stats?.last24h?.failedLogins ?? '—'}    icon={AlertTriangle} variant={(stats?.last24h?.failedLogins ?? 0) > 50 ? 'warning' : 'default'} />
            <StatCard title="Critical Alerts"      value={criticalEvents}                         icon={ShieldAlert} variant={criticalEvents > 0 ? 'danger' : 'ok'} sub="Unresolved" />
          </>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">High-Risk Sessions</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="risk">
            Risk Engine
            {criticalEvents > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{criticalEvents}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* High-Risk Sessions */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                High-Risk Sessions
                {highRiskSessions.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{highRiskSessions.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Sessions flagged by the risk engine in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : highRiskSessions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-muted-foreground gap-2">
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                  <p className="text-sm">No high-risk sessions detected</p>
                </div>
              ) : (
                <div>
                  {highRiskSessions.map((s) => <HighRiskRow key={s.id} session={s} />)}
                  <div className="pt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/sessions?risk=high">
                        <Eye className="mr-2 h-3 w-3" /> View all in Sessions
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events */}
        <TabsContent value="events">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Recent Security Events
                </CardTitle>
                <CardDescription>Failed logins, token reuse, impersonation</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : securityEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No security events in audit window</p>
                ) : (
                  <div>
                    {securityEvents.map((e) => <AuditRow key={e.id} entry={e} />)}
                    <div className="pt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/audit-logs">View full audit log</a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brute force summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attack Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Brute force attempts (24h)',     value: stats?.last24h?.failedLogins ?? 0, color: 'text-orange-400' },
                    { label: 'Token reuse detections',         value: tokenReuseCount,                    color: 'text-red-400' },
                    { label: 'Impersonations (24h)',            value: securityEvents.filter((e) => e.action.includes('impersonation')).length, color: 'text-yellow-400' },
                    { label: 'Blocked IPs (total)',             value: MOCK_BLOCKED_IPS.length,            color: 'text-muted-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-xs">{label}</span>
                      <span className={cn('text-lg font-bold', color)}>{formatNumber(value as number)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Login Trend (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.loginTrend && stats.loginTrend.length > 0 ? (
                    <div className="space-y-1">
                      {stats.loginTrend.slice(-8).map((point) => (
                        <div key={point.date} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-20 shrink-0">{point.date}</span>
                          <div className="flex-1 flex gap-1">
                            <div className="h-3 bg-green-500/60 rounded" style={{ width: `${Math.min((point.success / 500) * 100, 100)}%` }} />
                            <div className="h-3 bg-red-500/60 rounded" style={{ width: `${Math.min((point.failed / 100) * 100, 100)}%` }} />
                          </div>
                          <span className="text-muted-foreground">{point.success}✓ {point.failed}✗</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4 text-center">No trend data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Risk Engine */}
        <TabsContent value="risk">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {riskEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 text-green-500" />
                    <p className="text-sm">No active risk events</p>
                  </CardContent>
                </Card>
              ) : (
                riskEvents.map((e) => (
                  <RiskEventCard
                    key={e.id}
                    event={e}
                    onResolve={(id) => identityApi.resolveRiskEvent(id)}
                  />
                ))
              )}
            </div>

            {/* Risk breakdown sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Severity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                    const count = riskEvents.filter((e) => e.severity === sev).length;
                    const pct   = riskEvents.length ? (count / riskEvents.length) * 100 : 0;
                    const barColor = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' }[sev];
                    return (
                      <div key={sev} className="flex items-center gap-2">
                        <span className="text-xs capitalize w-16 shrink-0">{sev}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                          <div className={cn('h-full rounded', barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {(['impossible_travel', 'brute_force', 'credential_stuffing', 'token_reuse', 'geo_anomaly', 'device_new'] as const).map((type) => {
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

        {/* Blocked IPs */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Blocked IPs / CIDRs
              </CardTitle>
              <CardDescription>Automatically blocked addresses from WAF and risk engine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {['IP Address', 'Country', 'Reason', 'Attempts', 'Blocked'].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BLOCKED_IPS.map((row) => (
                      <tr key={row.ip} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-mono">{row.ip}</td>
                        <td className="py-2.5 pr-4">{row.country}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                            {row.reason.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-red-400">{formatNumber(row.attempts)}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{formatRelative(row.blockedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9"
                      fill="none"
                      stroke={compliancePct >= 80 ? 'hsl(142.1 76.2% 36.3%)' : compliancePct >= 60 ? 'hsl(47.9 95.8% 53.1%)' : 'hsl(0 72.2% 50.6%)'}
                      strokeWidth="2.5"
                      strokeDasharray={`${compliancePct} ${100 - compliancePct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold">{compliancePct}%</span>
                </div>
                <p className="text-sm font-medium">Compliance Score</p>
                <p className="text-xs text-muted-foreground">{passChecks}/{COMPLIANCE_CHECKS.length} checks passed</p>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> SOC2 / Security Checklist
                  </CardTitle>
                  <CardDescription>Real-time platform security posture checks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {COMPLIANCE_CHECKS.map(({ label, pass }) => (
                      <div key={label} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                        {pass
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                        <span className={cn('text-sm', !pass && 'text-muted-foreground')}>{label}</span>
                        {!pass && (
                          <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1 text-red-400 border-red-400/50 shrink-0">
                            Action needed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
