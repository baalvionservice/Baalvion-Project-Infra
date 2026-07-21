"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ClipboardCheck, Check, X, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  listSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
  verifySellerApplicationIdentity,
  type SellerApplication,
} from '@/lib/api/commerce-admin';

const STATUS_TABS: { label: string; value: 'pending' | 'approved' | 'rejected' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function SellerApplicationsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback((s: typeof status) => {
    setLoading(true);
    setError(null);
    listSellerApplications({ status: s, limit: 100 })
      .then((res) => setApplications(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(status); }, [status, load]);

  const handleApprove = async (app: SellerApplication) => {
    setActingOn(app.id);
    try {
      await approveSellerApplication(app.id);
      toast({ title: 'Application approved', description: `${app.storeName} can now list products — the seller has been granted access to the marketplace.` });
      load(status);
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't approve", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  const handleVerifyIdentity = async (app: SellerApplication) => {
    setActingOn(app.id);
    try {
      await verifySellerApplicationIdentity(app.id);
      toast({ title: 'Identity marked verified' });
      load(status);
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't verify identity", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (app: SellerApplication) => {
    if (!rejectReason.trim()) return;
    setActingOn(app.id);
    try {
      await rejectSellerApplication(app.id, rejectReason.trim());
      toast({ title: 'Application rejected' });
      setRejectingId(null);
      setRejectReason('');
      load(status);
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't reject", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="p-10 space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Seller Applications</h1>
        <p className="text-text-muted font-medium">Review and approve requests to open a new store on the platform.</p>
      </header>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-5 h-10 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              status === tab.value ? 'bg-brand-green text-black' : 'bg-brand-void border border-brand-border text-text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">
          {error}
        </ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading applications…
        </div>
      ) : applications.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <ClipboardCheck className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">No {status} applications.</p>
        </ListingCard>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ListingCard key={app.id} className="p-6 border-brand-border bg-brand-surface">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{app.storeName}</h3>
                    <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'warning' : 'default'} className="text-[8px]">
                      {app.status}
                    </Badge>
                    <span className="text-[10px] text-text-muted font-mono uppercase">{app.countryCode} · {app.currencyCode}</span>
                  </div>
                  {app.description && <p className="text-sm text-text-muted max-w-2xl">{app.description}</p>}
                  <p className="text-[10px] text-text-ghost font-mono">
                    Applicant #{app.applicantUserId} · Submitted {new Date(app.createdAt).toLocaleString()}
                  </p>
                  {(app.legalFullName || app.dateOfBirth || app.phoneNumber) && (
                    <div className="mt-2 p-3 rounded-lg bg-brand-void/50 border border-brand-border space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-text-muted uppercase">Identity</span>
                        <Badge variant={app.identityVerified ? 'success' : 'default'} className="text-[7px]">
                          {app.identityVerified ? 'verified' : 'not verified'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {app.legalFullName || '—'} · DOB {app.dateOfBirth || '—'} · {app.phoneNumber || '—'}
                      </p>
                    </div>
                  )}
                  {app.payoutWalletAddress && (
                    <p className="text-[10px] text-text-ghost font-mono">
                      Payout: {app.payoutCurrency} → {app.payoutWalletAddress}
                    </p>
                  )}
                  {app.status === 'rejected' && app.rejectionReason && (
                    <p className="text-[11px] text-semantic-error">Reason: {app.rejectionReason}</p>
                  )}
                </div>

                {app.status === 'pending' && (
                  <div className="flex flex-col gap-3 shrink-0">
                    {rejectingId === app.id ? (
                      <div className="flex flex-col gap-2 w-full md:w-72">
                        <input
                          autoFocus
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection…"
                          className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-xs text-white outline-none focus:border-semantic-error"
                        />
                        <div className="flex gap-2">
                          <AppButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(app)}
                            disabled={!rejectReason.trim() || actingOn === app.id}
                            className="flex-1"
                          >
                            {actingOn === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                          </AppButton>
                          <AppButton size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Cancel</AppButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {!app.identityVerified && (
                          <AppButton
                            size="sm"
                            variant="secondary"
                            onClick={() => handleVerifyIdentity(app)}
                            disabled={actingOn === app.id}
                            className="gap-2"
                            title="Mark identity manually verified"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </AppButton>
                        )}
                        <AppButton
                          size="sm"
                          onClick={() => handleApprove(app)}
                          disabled={actingOn === app.id}
                          className="bg-brand-green text-black gap-2"
                        >
                          {actingOn === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve</>}
                        </AppButton>
                        <AppButton size="sm" variant="danger" onClick={() => setRejectingId(app.id)} disabled={actingOn === app.id} className="gap-2">
                          <X className="w-4 h-4" /> Reject
                        </AppButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
