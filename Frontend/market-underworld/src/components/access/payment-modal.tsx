"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { checkoutCommunity, getCommunity, type CryptoAsset, type CryptoCheckout } from "@/lib/api/community";

const POLL_MS = 7000;

// Only list an asset here once its merchant receiving address is actually configured (CMS
// Integrations & Keys vault, provider=crypto) — selecting an unconfigured asset fails checkout
// with "no merchant receiving address configured" (see CryptoGateway#requireAddress).
const ASSET_OPTIONS: { asset: CryptoAsset; label: string }[] = [
  { asset: "BTC", label: "Bitcoin (BTC)" },
  { asset: "USDT_TRC20", label: "USDT (TRC20)" },
  { asset: "ETH_BEP20", label: "ETH (BEP20 — Binance-Peg, BSC network)" },
  { asset: "ETH", label: "ETH (Native — Ethereum mainnet)" },
  { asset: "USDT_BEP20", label: "USDT (BEP20 — BSC network)" },
];

export interface AccessTierPlan {
  slug: string;
  name: string;
  priceLabel: string;
  redirectTo: string;
}

type Stage = "select-asset" | "creating" | "awaiting-payment" | "verified" | "activating";

export function PaymentModal({ plan, open, onOpenChange }: { plan: AccessTierPlan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("select-asset");
  const [checkout, setCheckout] = useState<CryptoCheckout | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      setStage("select-asset");
      setCheckout(null);
      setQrDataUrl(null);
    }
  }, [open]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!plan) return null;

  const selectAsset = async (asset: CryptoAsset) => {
    setStage("creating");
    try {
      const result = await checkoutCommunity(plan.slug, asset);
      setCheckout(result);
      // BTC has a real, wallet-supported URI standard (BIP21) that pre-fills both the address
      // AND the amount when scanned — meaningfully faster/safer for the payer than a bare
      // address. No equivalent widely-supported standard exists for USDT-TRC20/ERC20 wallets,
      // so those QR codes encode the plain address only (always scannable, never wrong).
      const qrPayload = result.asset === "BTC" ? `bitcoin:${result.address}?amount=${result.amountValue}` : result.address;
      QRCode.toDataURL(qrPayload, { margin: 1, width: 220, color: { dark: "#00ff9d", light: "#00000000" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
      setStage("awaiting-payment");

      pollRef.current = setInterval(async () => {
        const detail = await getCommunity(plan.slug);
        if (detail?.membership?.status === "paid" || detail?.membership?.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStage("verified");
          setTimeout(() => setStage("activating"), 1400);
          setTimeout(() => {
            router.push(plan.redirectTo);
          }, 3200);
        }
      }, POLL_MS);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't start checkout", description: err instanceof Error ? err.message : "Please try again." });
      setStage("select-asset");
    }
  };

  const copyAddress = () => {
    if (!checkout) return;
    navigator.clipboard.writeText(checkout.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#050807] border border-emerald-500/20 text-white max-w-lg font-mono">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 tracking-widest uppercase text-sm">Complete Deposit</DialogTitle>
          <DialogDescription className="text-gray-500">
            {plan.name} <span className="text-emerald-400">({plan.priceLabel})</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === "select-asset" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Payment Method</p>
              {ASSET_OPTIONS.map((opt) => (
                <button
                  key={opt.asset}
                  onClick={() => selectAsset(opt.asset)}
                  className="w-full h-14 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all flex items-center justify-between px-5 text-sm font-bold"
                >
                  {opt.label}
                  <span className="text-emerald-500 text-xs">SELECT →</span>
                </button>
              ))}
            </motion.div>
          )}

          {stage === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-gray-500 uppercase tracking-widest">Generating deposit address…</p>
            </motion.div>
          )}

          {stage === "awaiting-payment" && checkout && (
            <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pt-2">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Payment QR code" className="rounded-lg border border-emerald-500/20" width={180} height={180} />
                ) : (
                  <div className="w-[180px] h-[180px] rounded-lg border border-emerald-500/20 bg-black/40 animate-pulse" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Amount</p>
                  <p className="font-bold text-white">{checkout.amountDisplay}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Network</p>
                  <p className="font-bold text-white">{checkout.network}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-gray-600 uppercase tracking-widest text-[10px]">Address</p>
                <div className="flex items-center gap-2 bg-black/50 border border-emerald-500/20 rounded-lg p-3">
                  <code className="text-[11px] text-emerald-300 break-all flex-1">{checkout.address}</code>
                  <button onClick={copyAddress} className="shrink-0 text-gray-500 hover:text-emerald-400 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <p className="text-[11px] uppercase tracking-widest">Waiting for blockchain confirmation…</p>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    style={{ width: "40%" }}
                  />
                </div>
                <p className="text-[10px] text-gray-600">This updates automatically — no need to refresh.</p>
              </div>
            </motion.div>
          )}

          {stage === "verified" && (
            <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              <p className="text-emerald-300 font-bold uppercase tracking-widest text-sm">Payment Verified</p>
            </motion.div>
          )}

          {stage === "activating" && (
            <motion.div key="activating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-sm">Activating Account…</p>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Loading Marketplace Protocol…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 pt-2 text-[10px] text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          Non-custodial — this deposit goes directly to our wallet, never held by a third party.
        </div>
      </DialogContent>
    </Dialog>
  );
}
