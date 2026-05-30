'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Mail, MailCheck, KeyRound, Building2, CalendarDays, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

const initials = (name: string) =>
  (name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString() : '—';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const currentOrg = useAuthStore((s) => s.currentOrg);
  const setUser = useAuthStore((s) => s.setUser);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" description="Your account details" />
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Not signed in. <Link className="text-primary underline" href="/login">Sign in</Link> to view your profile.
        </CardContent></Card>
      </div>
    );
  }

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await authApi.me();
      const me = res?.data?.data;
      if (me) { setUser(me); toast.success('Profile refreshed from server'); }
    } catch {
      toast.error('Could not refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const facts: { icon: typeof Mail; label: string; value: React.ReactNode }[] = [
    { icon: Mail, label: 'Email', value: user.email },
    {
      icon: user.emailVerifiedAt ? MailCheck : Mail,
      label: 'Email verified',
      value: user.emailVerifiedAt ? <Badge variant="secondary">Verified · {fmtDate(user.emailVerifiedAt)}</Badge> : <Badge variant="outline">Not verified</Badge>,
    },
    {
      icon: user.mfaEnabled ? ShieldCheck : ShieldAlert,
      label: 'Two-factor (MFA)',
      value: user.mfaEnabled ? <Badge variant="secondary">Enabled</Badge> : <Badge variant="destructive">Disabled</Badge>,
    },
    { icon: KeyRound, label: 'Role', value: <Badge>{String(user.role)}</Badge> },
    { icon: Building2, label: 'Organization', value: currentOrg?.name || user.orgId || '—' },
    { icon: CalendarDays, label: 'Member since', value: fmtDate(user.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details and security status"
        actions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
            <AvatarFallback className="text-lg">{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{user.fullName || 'Unnamed user'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <div className="mt-2 flex gap-2">
              <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status}</Badge>
              <span className="text-xs text-muted-foreground">ID #{user.id}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex items-start gap-3 rounded-lg border p-3">
              <f.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</p>
                <div className="text-sm font-medium">{f.value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
          <CardDescription>{user.permissions?.length || 0} granted</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(user.permissions?.length ? user.permissions : ['—']).map((p) => (
            <Badge key={p} variant="outline" className="font-mono text-[11px]">{p}</Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Manage credentials and platform settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/settings">Platform settings</Link></Button>
          <Button asChild variant="outline"><Link href="/sessions">Active sessions</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
