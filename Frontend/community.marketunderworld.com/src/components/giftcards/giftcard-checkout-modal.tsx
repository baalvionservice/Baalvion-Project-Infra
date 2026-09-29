"use client"

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Wallet } from "lucide-react";
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
  checkoutGiftCardWithWallet,
  getMyOrder,
  type CryptoAsset,
  type GiftCardBrand,
  type GiftCardCheckout,
} from "@/lib/api/giftcards";
import { CryptoPaymentPanel } from "@/components/shared/crypto-payment-panel";

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
  walletBalance,
}: {
  brand: GiftCardBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Real available USD balance from wallet-service, if known — enables "Pay with Wallet Balance". */
  walletBalance?: number;
}) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("select-denomination");
  const [denomination, setDenomination] = useState<number | null>(null);
  const [customDenomination, setCustomDenomination] = useState("");
  const [checkout, setCheckout] = useState<GiftCardCheckout | null>(null);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStage("select-denomination");
      setDenomination(null);
      setCustomDenomination("");
      setCheckout(null);
      setFulfillmentError(null);
    }
  }, [open]);

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
      setStage("awaiting-payment");
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't start checkout", description: err instanceof Error ? err.message : "Please try again." });
      setStage("select-asset");
    }
  };

  const payWithWallet = async () => {
    if (!denomination) return;
    setStage("creating");
    try {
      const result = await checkoutGiftCardWithWallet(brand.slug, denomination);
      if (result.status === "fulfilled") {
        setStage("fulfilled");
      } else if (result.status === "failed") {
        const order = await getMyOrder(result.orderId);
        setFulfillmentError(order?.fulfillmentError || "Delivery failed. Support has been notified.");
        setStage("failed");
      } else {
        // Still fulfilling at the moment the request returned (slow supplier call) — the order
        // is real and paid; give it a moment and check once more rather than leaving the modal stuck.
        setStage("fulfilling");
        const order = await getMyOrder(result.orderId);
        if (order?.status === "fulfilled") setStage("fulfilled");
        else if (order?.status === "failed") {
          setFulfillmentError(order.fulfillmentError || "Delivery failed. Support has been notified.");
          setStage("failed");
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't complete checkout", description: err instanceof Error ? err.message : "Please try again." });
      setStage("select-asset");
    }
  };

  const pollOrder = async (): Promise<boolean> => {
    if (!checkout) return false;
    const order = await getMyOrder(checkout.orderId);
    if (!order) return false;
    if (order.status === "fulfilling") {
      setStage("fulfilling");
      return false;
    }
    if (order.status === "fulfilled") {
      setStage("fulfilled");
      return true;
    }
    if (order.status === "failed") {
      setFulfillmentError(order.fulfillmentError || "Fulfillment failed — your payment was received, support has been notified.");
      setStage("failed");
      return true;
    }
    return false;
  };

  const denominationOptions = brand.denominationType === "FIXED" ? brand.fixedDenominations : null;
  const canPayWithWallet = denomination != null && walletBalance != null && walletBalance >= denomination;

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
              {canPayWithWallet && (
                <button
                  onClick={payWithWallet}
                  className="w-full h-14 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/15 transition-all flex items-center justify-between px-5 text-sm font-bold"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" /> Wallet Balance
                  </span>
                  <span className="text-emerald-400 text-xs">INSTANT →</span>
                </button>
              )}
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
              <p className="text-xs text-gray-500 uppercase tracking-widest">Starting checkout…</p>
            </motion.div>
          )}

          {stage === "awaiting-payment" && checkout && (
            <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CryptoPaymentPanel
                address={checkout.address}
                amountValue={checkout.amountValue}
                amountDisplay={checkout.amountDisplay}
                network={checkout.network}
                asset={checkout.asset}
                onPoll={pollOrder}
                pollMs={POLL_MS}
              />
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
