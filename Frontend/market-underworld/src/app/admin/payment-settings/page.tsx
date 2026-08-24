"use client"

import React, { useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Wallet, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoreAdmin, updateStore } from '@/lib/api/commerce-admin';
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce';

type PaymentMode = 'standard' | 'crypto_only';

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<PaymentMode>('standard');
  const [wallets, setWallets] = useState<Record<string, string>>({ BTC: '', ETH: '', USDT: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStoreAdmin(MARKET_UNDERWORLD_STORE_ID)
      .then((store) => {
        const meta = (store.meta || {}) as { paymentMode?: PaymentMode; cryptoWallets?: Record<string, string> };
        setMode(meta.paymentMode === 'crypto_only' ? 'crypto_only' : 'standard');
        setWallets({ BTC: '', ETH: '', USDT: '', ...(meta.cryptoWallets || {}) });
      })
      .catch(() => toast({ variant: 'destructive', title: "Couldn't load payment settings" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStore(MARKET_UNDERWORLD_STORE_ID, {
        meta: { paymentMode: mode, cryptoWallets: wallets },
      });
      toast({ title: 'Payment settings saved', description: mode === 'crypto_only' ? 'Checkout now shows crypto payment only.' : 'Checkout uses standard payment gateways.' });
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't save", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-3 text-text-muted min-h-[50vh]">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10 max-w-3xl">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Payment Settings</h1>
        <p className="text-text-muted font-medium">Controls checkout for this storefront's own product listings only — no other Baalvion site is affected.</p>
      </header>

      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-text-secondary">
        Looking to configure BTC / USDT / ETH addresses for <strong className="text-white">Access Tier deposits</strong> (the /access page)? Those are a separate, automated-confirmation gateway — set them under CMS → Website → Integrations &amp; Keys → <strong className="text-white">Crypto (BTC / USDT-TRC20 / ETH-BEP20)</strong> in admin-platform, not here.
      </div>

      <ListingCard className="p-8 space-y-8 border-brand-border bg-brand-surface">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Checkout Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('standard')}
              className={`p-6 rounded-xl border text-left transition-all ${mode === 'standard' ? 'bg-brand-green/10 border-brand-green text-white' : 'bg-brand-void border-brand-border text-text-muted'}`}
            >
              <div className="font-bold mb-1">Standard</div>
              <div className="text-xs opacity-70">Card / UPI checkout (Razorpay, PayU when configured)</div>
            </button>
            <button
              onClick={() => setMode('crypto_only')}
              className={`p-6 rounded-xl border text-left transition-all ${mode === 'crypto_only' ? 'bg-brand-green/10 border-brand-green text-white' : 'bg-brand-void border-brand-border text-text-muted'}`}
            >
              <div className="font-bold mb-1">Crypto Only</div>
              <div className="text-xs opacity-70">Hides all card gateways — buyers pay by wallet transfer, you confirm manually</div>
            </button>
          </div>
        </div>

        {mode === 'crypto_only' && (
          <div className="p-4 bg-semantic-warning/5 border border-semantic-warning/20 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-semantic-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Crypto payments don&apos;t auto-confirm — you must verify each transaction on-chain and mark the order paid from Order Management. Orders sit as &quot;pending&quot; until you do.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" /> Wallet Addresses (shown to buyers when Crypto Only is active)
          </label>
          {(['BTC', 'ETH', 'USDT'] as const).map((coin) => (
            <div key={coin} className="flex items-center gap-3">
              <Badge variant="default" className="w-16 justify-center shrink-0">{coin}</Badge>
              <input
                value={wallets[coin] || ''}
                onChange={(e) => setWallets((prev) => ({ ...prev, [coin]: e.target.value }))}
                placeholder={`${coin} wallet address`}
                className="flex-1 bg-brand-void border border-brand-border h-11 rounded-lg px-4 text-sm font-mono text-white outline-none focus:border-brand-green"
              />
            </div>
          ))}
        </div>

        <AppButton onClick={handleSave} isLoading={saving} className="w-full h-12 font-bold uppercase text-xs tracking-widest">
          Save Payment Settings
        </AppButton>
      </ListingCard>
    </div>
  );
}
