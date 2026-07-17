"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2, ShieldCheck } from "lucide-react";
import { NexusButton } from "@/components/ui/nexus-button";
import { useToast } from "@/hooks/use-toast";
import { checkoutCommunity, getCommunity, type CryptoAsset, type CryptoCheckout as CryptoCheckoutInfo } from "@/lib/api/community";

const POLL_MS = 8000;

const ASSET_OPTIONS: { asset: CryptoAsset; label: string }[] = [
  { asset: "USDT_TRC20", label: "USDT (TRC20)" },
  { asset: "ETH_BEP20", label: "ETH (BEP20)" },
  { asset: "BTC", label: "Bitcoin" },
];

/**
 * Non-custodial crypto checkout: shows the merchant's own receiving address (USDT-TRC20,
 * ETH-BEP20, or BTC — see payment-service's CryptoGateway) and a tagged target amount, then
 * polls this community's own membership status until payment-service's chain poller confirms
 * the on-chain transfer and flips it to 'paid'. No card form, no hosted checkout redirect —
 * this IS the whole flow.
 */
export function CryptoCheckout({ slug, onPaid }: { slug: string; onPaid?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [asset, setAsset] = useState<CryptoAsset | null>(null);
  const [checkout, setCheckout] = useState<CryptoCheckoutInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startCheckout = async (selected: CryptoAsset) => {
    setAsset(selected);
    setLoading(true);
    try {
      const result = await checkoutCommunity(slug, selected);
      setCheckout(result);
      pollRef.current = setInterval(async () => {
        const detail = await getCommunity(slug);
        if (detail?.membership?.status === "paid" || detail?.membership?.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          toast({ title: "Payment confirmed", description: "You now have access to this community." });
          onPaid?.();
          router.refresh();
        }
      }, POLL_MS);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't start checkout", description: err instanceof Error ? err.message : "Please try again." });
      setAsset(null);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (!checkout) return;
    navigator.clipboard.writeText(checkout.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!asset) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Pay with:</p>
        <div className="grid grid-cols-3 gap-3">
          {ASSET_OPTIONS.map((opt) => (
            <NexusButton
              key={opt.asset}
              onClick={() => startCheckout(opt.asset)}
              isLoading={loading}
              variant={opt.asset === "BTC" ? "outline" : "primary"}
              className={opt.asset === "BTC" ? "h-14 font-bold border-fuchsia-500/30 text-fuchsia-300" : "h-14 font-bold nexus-gradient-bg"}
            >
              {opt.label}
            </NexusButton>
          ))}
        </div>
      </div>
    );
  }

  if (!checkout) {
    return <div className="text-gray-500 text-sm">Preparing checkout…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm font-bold">Waiting for payment confirmation…</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Send exactly</p>
        <p className="text-2xl font-bold text-white">{checkout.amountDisplay}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">To this {checkout.network} address</p>
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-4">
          <code className="text-xs text-gray-300 break-all flex-1">{checkout.address}</code>
          <button onClick={copyAddress} className="shrink-0 text-gray-500 hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80">
          Send the exact amount shown above — this confirms your specific payment. This page
          updates automatically once the transaction is confirmed on-chain; no need to refresh.
        </p>
      </div>
    </div>
  );
}
