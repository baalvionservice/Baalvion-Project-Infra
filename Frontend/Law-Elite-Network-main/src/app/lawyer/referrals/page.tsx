"use client";

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Check, X, Share2, CheckCircle2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/lib/countries';
import { getStates, getCities, type GeoState, type GeoCity } from '@/services/geo/geoService';
import { getPracticeAreas, type PracticeArea } from '@/services/practiceAreas/practiceAreaService';
import { searchLawyers } from '@/services/lawyers/lawyerService';
import {
  createCaseReferral, listCaseReferrals, acceptCaseReferral, declineCaseReferral,
  cancelCaseReferral, completeCaseReferral, type CaseReferral,
} from '@/services/caseReferrals/caseReferralService';

export default function LawyerReferralsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <ReferralsContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function ReferralsContent() {
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('US');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [practiceAreaId, setPracticeAreaId] = useState('');
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const [incoming, setIncoming] = useState<CaseReferral[]>([]);
  const [outgoing, setOutgoing] = useState<CaseReferral[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    getPracticeAreas().then(setPracticeAreas).catch(() => setPracticeAreas([]));
  }, []);

  useEffect(() => {
    setStateId(''); setCityId(''); setCities([]);
    getStates(countryCode).then(setStates).catch(() => setStates([]));
  }, [countryCode]);

  useEffect(() => {
    setCityId('');
    if (!stateId) { setCities([]); return; }
    getCities(Number(stateId)).then(setCities).catch(() => setCities([]));
  }, [stateId]);

  const findLawyers = async () => {
    const results = await searchLawyers({
      countryCode,
      stateId: stateId || undefined,
      cityId: cityId || undefined,
      practiceAreaId: practiceAreaId || undefined,
    });
    setCandidates(results);
  };

  const loadInboxes = async () => {
    setLoadingInbox(true);
    try {
      const [inc, out] = await Promise.all([
        listCaseReferrals('incoming'),
        listCaseReferrals('outgoing'),
      ]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e: any) {
      toast({ title: 'Failed to load referrals', description: e?.message, variant: 'destructive' });
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => { loadInboxes(); }, []);

  const handleSend = async () => {
    if (!selectedLawyerId || !title.trim()) {
      toast({ title: 'Choose a lawyer and enter a title', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await createCaseReferral({
        toLawyerId: Number(selectedLawyerId),
        title: title.trim(),
        description: description.trim() || undefined,
        countryCode,
        stateId: stateId ? Number(stateId) : undefined,
        cityId: cityId ? Number(cityId) : undefined,
        practiceAreaId: practiceAreaId ? Number(practiceAreaId) : undefined,
      });
      toast({ title: 'Referral sent' });
      setTitle(''); setDescription(''); setSelectedLawyerId(''); setCandidates([]);
      await loadInboxes();
    } catch (e: any) {
      toast({ title: 'Failed to send referral', description: e?.response?.data?.error?.message || e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const act = async (id: number, fn: (id: number) => Promise<any>, successMsg: string) => {
    setBusyId(id);
    try {
      await fn(id);
      toast({ title: successMsg });
      await loadInboxes();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.response?.data?.error?.message || e?.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container mx-auto px-8 pt-8 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Case Referrals</h1>
        <p className="text-slate-500 text-sm mt-1">Route cases to trusted counsel across jurisdictions.</p>
      </header>

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Send Referral</TabsTrigger>
          <TabsTrigger value="incoming">Incoming {incoming.filter(r => r.status === 'sent').length > 0 && `(${incoming.filter(r => r.status === 'sent').length})`}</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <Card className="max-w-3xl">
            <CardHeader><CardTitle>Create Referral</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Practice Area</Label>
                  <Select value={practiceAreaId} onValueChange={setPracticeAreaId}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {practiceAreas.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={cityId} onValueChange={setCityId} disabled={!cities.length}>
                    <SelectTrigger><SelectValue placeholder={cities.length ? 'Any' : 'No data yet'} /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={findLawyers}>Find Lawyers</Button>

              {candidates.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Choose Lawyer</Label>
                  <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                    <SelectTrigger><SelectValue placeholder="Select a lawyer" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {candidates.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name} — {l.location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Referral Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cross-border IP dispute" />
              </div>
              <div className="space-y-1.5">
                <Label>Case Details</Label>
                <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context for the recipient..." />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Send Referral
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="mt-6">
          <ReferralList
            referrals={incoming}
            loading={loadingInbox}
            emptyLabel="No incoming referrals."
            busyId={busyId}
            renderActions={(r) => r.status === 'sent' ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => act(r.id, declineCaseReferral, 'Referral declined')}>
                  <X className="w-3.5 h-3.5 mr-1" /> Decline
                </Button>
                <Button size="sm" disabled={busyId === r.id} onClick={() => act(r.id, acceptCaseReferral, 'Referral accepted')}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Accept
                </Button>
              </div>
            ) : <StatusBadge status={r.status} />}
            counterpartLabel="From"
            counterpart={(r) => r.fromLawyer}
          />
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          <ReferralList
            referrals={outgoing}
            loading={loadingInbox}
            emptyLabel="No outgoing referrals."
            busyId={busyId}
            renderActions={(r) => {
              if (r.status === 'sent') {
                return (
                  <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => act(r.id, cancelCaseReferral, 'Referral cancelled')}>
                    Cancel
                  </Button>
                );
              }
              if (r.status === 'accepted') {
                return (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                    <Share2 className="w-3.5 h-3.5" /> Accepted — share a case from your matters to proceed
                  </span>
                );
              }
              if (r.status === 'case_shared') {
                return (
                  <Button size="sm" disabled={busyId === r.id} onClick={() => act(r.id, completeCaseReferral, 'Referral marked completed')}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Completed
                  </Button>
                );
              }
              return <StatusBadge status={r.status} />;
            }}
            counterpartLabel="To"
            counterpart={(r) => r.toLawyer}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferralList({ referrals, loading, emptyLabel, renderActions, counterpartLabel, counterpart }: {
  referrals: CaseReferral[];
  loading: boolean;
  emptyLabel: string;
  busyId: number | null;
  renderActions: (r: CaseReferral) => React.ReactNode;
  counterpartLabel: string;
  counterpart: (r: CaseReferral) => { name: string; email: string };
}) {
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!referrals.length) return <Card className="p-10 text-center text-sm text-muted-foreground">{emptyLabel}</Card>;
  return (
    <div className="space-y-3">
      {referrals.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <p className="font-semibold">{r.title}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {counterpartLabel}: {counterpart(r)?.name} {r.practiceArea ? `· ${r.practiceArea.name}` : ''} {r.city ? `· ${r.city.name}` : ''}
              </p>
              {r.description && <p className="text-xs text-slate-500 mt-1 italic">{r.description}</p>}
            </div>
            <div>{renderActions(r)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    declined: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-600',
    completed: 'bg-emerald-100 text-emerald-700', case_shared: 'bg-blue-100 text-blue-700',
  };
  return <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${colors[status] || 'bg-slate-100 text-slate-600'}`}>{status.replace('_', ' ')}</span>;
}
