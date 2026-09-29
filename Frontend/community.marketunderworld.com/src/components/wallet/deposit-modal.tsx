"use client"

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { initiateDeposit, getDepositStatus, type CryptoAsset, type WalletDeposit } from "@/lib/api/wallet";
import { CryptoPaymentPanel } from "@/components/shared/crypto-payment-panel";

const POLL_MS = 7000;

const ASSET_OPTIONS: { asset: CryptoAsset; label: string }[] = [
  { asset: "BTC", label: "Bitcoin (BTC)" },
  { asset: "USDT_TRC20", label: "USDT (TRC20)" },
  { asset: "ETH_BEP20", label: "ETH (BEP20)" },
];

type Stage = "enter-amount" | "select-asset" | "creating" | "awaiting-payment" | "credited" | "failed";

export function DepositModal({
  open,
  onOpenChange,
  onCredited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the deposit is confirmed credited, so the caller can refetch its balance. */
  onCredited?: () => void;
}) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("enter-amount");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState<WalletDeposit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStage("enter-amount");
      setAmount("");
      setDeposit(null);
      setError(null);
    }
  }, [open]);

  const parsedAmount = Number(amount);
  const amountValid = amount !== "" && Number.isFinite(parsedAmount) && parsedAmount >= 1;

  const selectAsset = async (asset: CryptoAsset) => {
    if (!amountValid) return;
    setStage("creating");
    try {
      const result = await initiateDeposit(parsedAmount, asset);
      setDeposit(result);
      setStage("awaiting-payment");
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't start deposit", description: err instanceof Error ? err.message : "Please try again." });
      setStage("select-asset");
    }
  };

  const pollDeposit = async (): Promise<boolean> => {
    if (!deposit) return false;
    try {
      const status = await getDepositStatus(deposit.depositId);
      if (status.status === "credited") {
        setStage("credited");
        onCredited?.();
        return true;
      }
      if (status.status === "failed" || status.status === "expired") {
        setError(status.fulfillmentError || "Deposit failed. Support has been notified.");
        setStage("failed");
        return true;
      }
    } catch {
      // transient poll failure — try again on the next tick
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border border-emerald-500/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 tracking-widest uppercase text-sm">Add Funds</DialogTitle>
          <DialogDescription className="text-gray-500">
            {amountValid ? `$${parsedAmount.toFixed(2)} USD` : "Choose how much to deposit"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === "enter-amount" && (
            <motion.div key="amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
              <p className="text-xs text-gray-500">Any amount you choose — credited 1:1 as spendable USD balance.</p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={1}
                    placeholder="25.00"
                    className="w-full h-14 rounded-xl bg-black/40 border border-white/10 pl-8 pr-4 text-lg font-bold outline-none focus:border-emerald-500/50"
                  />
                </div>
                <button
                  onClick={() => amountValid && setStage("select-asset")}
                  disabled={!amountValid}
                  className="h-14 px-6 rounded-xl bg-emerald-500 text-black font-bold disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {stage === "select-asset" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Pay With</p>
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

          {stage === "awaiting-payment" && deposit && (
            <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CryptoPaymentPanel
                address={deposit.address}
                amountValue={deposit.amountValue}
                amountDisplay={deposit.amountDisplay}
                network={deposit.network}
                asset={deposit.asset}
                onPoll={pollDeposit}
                pollMs={POLL_MS}
                waitingLabel="Waiting for blockchain confirmation…"
              />
            </motion.div>
          )}

          {stage === "credited" && (
            <motion.div key="credited" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              <p className="text-emerald-300 font-bold uppercase tracking-widest text-sm">Funds added</p>
              <p className="text-gray-500 text-xs">Your balance has been updated.</p>
            </motion.div>
          )}

          {stage === "failed" && (
            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center gap-4 text-center px-4">
              <XCircle className="w-14 h-14 text-red-400" />
              <p className="text-red-300 font-bold uppercase tracking-widest text-sm">Deposit Failed</p>
              <p className="text-gray-500 text-xs">{error}</p>
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
