"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ShieldCheck, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { listPendingProducts, moderateProduct, type AdminProductQueueItem } from '@/lib/api/commerce-admin';

export default function ModerationQueuePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminProductQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listPendingProducts({ limit: 100 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load moderation queue'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (item: AdminProductQueueItem) => {
    setActingOn(item.id);
    try {
      await moderateProduct(item.storeId, item.id, 'approve');
      toast({ title: 'Listing approved', description: `${item.name} is now live on the storefront.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't approve", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (item: AdminProductQueueItem) => {
    if (!rejectReason.trim()) return;
    setActingOn(item.id);
    try {
      await moderateProduct(item.storeId, item.id, 'reject', rejectReason.trim());
      toast({ title: 'Listing rejected', description: 'Sent back to the seller with your reason.' });
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't reject", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="p-10 space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Listing Moderation</h1>
        <p className="text-text-muted font-medium">Review new and resubmitted listings before they go live on the storefront.</p>
      </header>

      {error ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">{error}</ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading queue…</div>
      ) : items.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <ShieldCheck className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">Nothing pending review.</p>
        </ListingCard>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ListingCard key={item.id} className="p-6 border-brand-border bg-brand-surface">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <Badge variant="warning" className="text-[8px]">pending review</Badge>
                    {item.store && <span className="text-[10px] text-text-muted font-mono uppercase">{item.store.name} · {item.store.countryCode}</span>}
                  </div>
                  {item.shortDescription && <p className="text-sm text-text-muted max-w-2xl">{item.shortDescription}</p>}
                  <p className="text-[10px] text-text-ghost font-mono">SKU: {item.sku || '—'}</p>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                  {rejectingId === item.id ? (
                    <div className="flex flex-col gap-2 w-full md:w-72">
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection…"
                        className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-xs text-white outline-none focus:border-semantic-error"
                      />
                      <div className="flex gap-2">
                        <AppButton size="sm" variant="danger" onClick={() => handleReject(item)} disabled={!rejectReason.trim() || actingOn === item.id} className="flex-1">
                          {actingOn === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                        </AppButton>
                        <AppButton size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Cancel</AppButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <AppButton size="sm" onClick={() => handleApprove(item)} disabled={actingOn === item.id} className="bg-brand-green text-black gap-2">
                        {actingOn === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve &amp; Publish</>}
                      </AppButton>
                      <AppButton size="sm" variant="danger" onClick={() => setRejectingId(item.id)} disabled={actingOn === item.id} className="gap-2">
                        <X className="w-4 h-4" /> Reject
                      </AppButton>
                    </div>
                  )}
                </div>
              </div>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
