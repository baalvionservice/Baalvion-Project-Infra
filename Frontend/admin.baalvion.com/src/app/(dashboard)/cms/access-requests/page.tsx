'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Send, Clock } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accessRequestsApi, type AccessRequest } from '@/lib/api/cms-access-requests';
import { CMS_ROLE_OPTIONS, cmsRoleLabel } from '@/lib/cms/permissions';
import { seesAllSites } from '@/lib/authz/siteScope';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { CmsRole } from '@/lib/types/cms-website.types';

// cms_admin is granted by an administrator, never self-requested.
const REQUESTABLE = CMS_ROLE_OPTIONS.filter((o) => o.value !== 'cms_admin' && o.value !== 'cms_reviewer' && o.value !== 'cms_compliance');

const STATUS_STYLE: Record<AccessRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data?.error?.message
  ?? (e as { message?: string })?.message ?? 'Something went wrong';

function RequestForm() {
  const qc = useQueryClient();
  const [websiteId, setWebsiteId] = useState('');
  const [role, setRole] = useState<CmsRole>('cms_author');
  const [note, setNote] = useState('');

  const { data: sites = [], isLoading } = useQuery({ queryKey: ['cms', 'access-requests', 'sites'], queryFn: accessRequestsApi.requestable });
  const send = useMutation({
    mutationFn: () => accessRequestsApi.create({ websiteId, role, note: note.trim() || undefined }),
    onSuccess: () => {
      toast.success('Request sent. An administrator will review it.');
      setWebsiteId(''); setNote('');
      qc.invalidateQueries({ queryKey: ['cms', 'access-requests'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Ask for access to a website</CardTitle>
        <CardDescription className="text-xs">
          You only see websites you have been given. Pick another one here and an administrator will approve or decline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Website</Label>
          <Select value={websiteId} onValueChange={setWebsiteId} disabled={isLoading || sites.length === 0}>
            <SelectTrigger><SelectValue placeholder={sites.length === 0 && !isLoading ? 'No other websites available' : 'Choose a website'} /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>What do you need to do there?</Label>
          <Select value={role} onValueChange={(v) => setRole(v as CmsRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REQUESTABLE.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} — {o.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Note (optional)</Label>
          <Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you need access, e.g. “writing the weekly market column”" />
        </div>
        <Button onClick={() => send.mutate()} disabled={!websiteId || send.isPending}>
          <Send className="mr-2 h-4 w-4" /> Send request
        </Button>
      </CardContent>
    </Card>
  );
}

function MyRequests() {
  const { data = [] } = useQuery({ queryKey: ['cms', 'access-requests', 'mine'], queryFn: accessRequestsApi.mine });
  if (data.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Your requests</CardTitle></CardHeader>
      <CardContent className="divide-y p-0">
        {data.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.website?.name ?? 'Website'}</p>
              <p className="text-xs text-muted-foreground">{cmsRoleLabel(r.requestedRole)} · {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.decisionNote && <p className="mt-0.5 text-xs text-muted-foreground">“{r.decisionNote}”</p>}
            </div>
            <Badge className={`capitalize ${STATUS_STYLE[r.status]}`} variant="secondary">{r.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PendingRow({ r }: { r: AccessRequest }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<CmsRole>(r.requestedRole);
  const done = () => qc.invalidateQueries({ queryKey: ['cms', 'access-requests'] });
  const approve = useMutation({
    mutationFn: () => accessRequestsApi.approve(r.id, { role }),
    onSuccess: () => { toast.success(`Access granted to ${r.requesterName || r.requesterEmail || 'user'}. It applies on their next sign-in refresh.`); done(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const deny = useMutation({
    mutationFn: () => accessRequestsApi.deny(r.id, {}),
    onSuccess: () => { toast.success('Request declined'); done(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const busy = approve.isPending || deny.isPending;
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{r.requesterName || r.requesterEmail || `User ${r.userId}`}</p>
          {r.requesterName && r.requesterEmail && <p className="text-xs text-muted-foreground">{r.requesterEmail}</p>}
          <p className="mt-1 text-xs">wants <span className="font-medium">{cmsRoleLabel(r.requestedRole)}</span> on <span className="font-medium">{r.website?.name}</span></p>
          {r.note && <p className="mt-1 text-xs text-muted-foreground">“{r.note}”</p>}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as CmsRole)}>
          <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REQUESTABLE.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => approve.mutate()} disabled={busy}><Check className="mr-1 h-4 w-4" />Approve</Button>
        <Button size="sm" variant="outline" onClick={() => deny.mutate()} disabled={busy}><X className="mr-1 h-4 w-4" />Decline</Button>
      </div>
    </div>
  );
}

function AdminQueue() {
  const { data = [], isLoading } = useQuery({ queryKey: ['cms', 'access-requests', 'pending'], queryFn: () => accessRequestsApi.list('pending'), refetchInterval: 60_000 });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Waiting for your decision {data.length > 0 && <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{data.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {isLoading ? <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
          : data.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No pending requests.</p>
          : data.map((r) => <PendingRow key={r.id} r={r} />)}
      </CardContent>
    </Card>
  );
}

export default function AccessRequestsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isAdmin = seesAllSites(roles);

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms' }, { label: 'Access requests' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access requests"
        description={isAdmin ? 'People asking to work on a website. Approve to give them access.' : 'Ask for access to a website you are not assigned to.'}
      />
      {isAdmin && <AdminQueue />}
      <div className="grid gap-6 lg:grid-cols-2">
        {!isAdmin && <RequestForm />}
        <MyRequests />
      </div>
    </div>
  );
}
