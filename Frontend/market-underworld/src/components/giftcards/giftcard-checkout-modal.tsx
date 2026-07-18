"use client"

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  checkoutGiftCard,
  getMyOrder,
  type CryptoAsset,
  type GiftCardBrand,
  type GiftCardCheckout,
} from "@/lib/api/giftcards";

const POLL_MS = 7000;

const ASSET_OPTIONS: { asset: CryptoAsset; label: string }[] = [
  { asset: "BTC", label: "Bitcoin (BTC)" },
  { asset: "USDT_TRC20", label: "USDT (TRC20)" },
  { asset: "ETH_BEP20", label: "ETH (BEP20)" },
];

type Stage = "select-denomination" | "select-asset" | "creating" | "awaiting-payment" | "fulfilling" | "fulfilled" | "failed";

export function GiftCardCheckoutModal({
  brand,
  open,
  onOpenChange,
}: {
  brand: GiftCardBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("select-denomination");
  const [denomination, setDenomination] = useState<number | null>(null);
  const [customDenomination, setCustomDenomination] = useState("");
  const [checkout, setCheckout] = useState<GiftCardCheckout | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      setStage("select-denomination");
      setDenomination(null);
      setCustomDenomination("");
      setCheckout(null);
      setQrDataUrl(null);
      setFulfillmentError(null);
    }
  }, [open]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!brand) return null;

  const pickDenomination = (value: number) => {
    setDenomination(value);
    setStage("select-asset");
  };

  const selectAsset = async (asset: CryptoAsset) => {
    if (!denomination) return;
    setStage("creating");
    try {
      const result = await checkoutGiftCard(brand.slug, denomination, asset);
      setCheckout(result);
      const qrPayload = result.asset === "BTC" ? `bitcoin:${result.address}?amount=${result.amountValue}` : result.address;
      QRCode.toDataURL(qrPayload, { margin: 1, width: 220, color: { dark: "#f472b6", light: "#00000000" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
      setStage("awaiting-payment");

      pollRef.current = setInterval(async () => {
        const order = await getMyOrder(result.orderId);
        if (!order) return;
        if (order.status === "fulfilling" && stage !== "fulfilling") setStage("fulfilling");
        if (order.status === "fulfilled") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStage("fulfilled");
        }
        if (order.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setFulfillmentError(order.fulfillmentError || "Fulfillment failed — your payment was received, support has been notified.");
          setStage("failed");
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

  const denominationOptions = brand.denominationType === "FIXED" ? brand.fixedDenominations : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border border-fuchsia-500/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-fuchsia-400 tracking-widest uppercase text-sm">{brand.name}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {denomination ? `${brand.currencyCode} ${denomination}` : "Choose a denomination"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === "select-denomination" && (
            <motion.div key="denom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
              {denominationOptions ? (
                <div className="grid grid-cols-3 gap-3">
                  {denominationOptions.map((v) => (
                    <button
                      key={v}
                      onClick={() => pickDenomination(v)}
                      className="h-16 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.03] hover:bg-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all font-bold text-lg"
                    >
                      {brand.currencyCode} {v}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Any amount between {brand.currencyCode} {brand.minDenomination} and {brand.currencyCode} {brand.maxDenomination}
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={customDenomination}
                      onChange={(e) => setCustomDenomination(e.target.value)}
                      min={brand.minDenomination ?? undefined}
                      max={brand.maxDenomination ?? undefined}
                      placeholder="Amount"
                      className="flex-1 h-14 rounded-xl bg-black/40 border border-white/10 px-4 text-lg font-bold outline-none focus:border-fuchsia-500/50"
                    />
                    <button
                      onClick={() => customDenomination && pickDenomination(Number(customDenomination))}
                      disabled={!customDenomination}
                      className="h-14 px-6 rounded-xl bg-fuchsia-500 text-black font-bold disabled:opacity-30"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {stage === "select-asset" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Payment Method</p>
              {ASSET_OPTIONS.map((opt) => (
                <button
                  key={opt.asset}
                  onClick={() => selectAsset(opt.asset)}
                  className="w-full h-14 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.03] hover:bg-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all flex items-center justify-between px-5 text-sm font-bold"
                >
                  {opt.label}
                  <span className="text-fuchsia-500 text-xs">SELECT →</span>
                </button>
              ))}
            </motion.div>
          )}

          {stage === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
              <p className="text-xs text-gray-500 uppercase tracking-widest">Generating deposit address…</p>
            </motion.div>
          )}

          {stage === "awaiting-payment" && checkout && (
            <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pt-2">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Payment QR code" className="rounded-lg border border-fuchsia-500/20" width={180} height={180} />
                ) : (
                  <div className="w-[180px] h-[180px] rounded-lg border border-fuchsia-500/20 bg-black/40 animate-pulse" />
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
                <div className="flex items-center gap-2 bg-black/50 border border-fuchsia-500/20 rounded-lg p-3">
                  <code className="text-[11px] text-fuchsia-300 break-all flex-1">{checkout.address}</code>
                  <button onClick={copyAddress} className="shrink-0 text-gray-500 hover:text-fuchsia-400 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-fuchsia-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-fuchsia-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <p className="text-[11px] uppercase tracking-widest">Waiting for blockchain confirmation…</p>
                </div>
                <p className="text-[10px] text-gray-600">This updates automatically — no need to refresh.</p>
              </div>
            </motion.div>
          )}

          {stage === "fulfilling" && (
            <motion.div key="fulfilling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-sm">Payment confirmed — purchasing your card…</p>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Talking to the supplier</p>
              </div>
            </motion.div>
          )}

          {stage === "fulfilled" && (
            <motion.div key="fulfilled" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-14 h-14 text-fuchsia-400" />
              <p className="text-fuchsia-300 font-bold uppercase tracking-widest text-sm">Card delivered</p>
              <p className="text-gray-500 text-xs">Check My Cards to view your redeem code.</p>
            </motion.div>
          )}

          {stage === "failed" && (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center gap-4 text-center px-4">
              <XCircle className="w-14 h-14 text-red-400" />
              <p className="text-red-300 font-bold uppercase tracking-widest text-sm">Delivery Failed</p>
              <p className="text-gray-500 text-xs">{fulfillmentError}</p>
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
