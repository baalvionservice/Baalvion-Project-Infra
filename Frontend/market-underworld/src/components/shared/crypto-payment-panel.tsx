"use client"

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Loader2 } from "lucide-react";

const DEFAULT_POLL_MS = 7000;

/**
 * QR code + address + "waiting for confirmation" panel shared by any real crypto-payment flow —
 * extracted from giftcard-checkout-modal.tsx's awaiting-payment stage (the first extraction point
 * was the wallet deposit flow, which needed the identical UI against a different poll endpoint).
 * Owns only the QR image and the poll interval; the caller decides what a poll tick means and
 * which stage to transition to via onPoll's return value.
 */
export function CryptoPaymentPanel({
  address,
  amountValue,
  amountDisplay,
  network,
  asset,
  onPoll,
  pollMs = DEFAULT_POLL_MS,
  waitingLabel = "Waiting for blockchain confirmation…",
}: {
  address: string;
  amountValue: string;
  amountDisplay: string;
  network: string;
  asset: string;
  /** Called on an interval; return true once the caller is done polling (success or failure). */
  onPoll: () => Promise<boolean>;
  pollMs?: number;
  waitingLabel?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const qrPayload = asset === "BTC" ? `bitcoin:${address}?amount=${amountValue}` : address;
    QRCode.toDataURL(qrPayload, { margin: 1, width: 220, color: { dark: "#f472b6", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));

    pollRef.current = setInterval(async () => {
      const done = await onPoll();
      if (done && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, pollMs);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-5 pt-2">
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
          <p className="font-bold text-white">{amountDisplay}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-600 uppercase tracking-widest text-[10px]">Network</p>
          <p className="font-bold text-white">{network}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-gray-600 uppercase tracking-widest text-[10px]">Address</p>
        <div className="flex items-center gap-2 bg-black/50 border border-fuchsia-500/20 rounded-lg p-3">
          <code className="text-[11px] text-fuchsia-300 break-all flex-1">{address}</code>
          <button onClick={copyAddress} className="shrink-0 text-gray-500 hover:text-fuchsia-400 transition-colors">
            {copied ? <Check className="w-4 h-4 text-fuchsia-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="border-t border-white/5 pt-4 space-y-2">
        <div className="flex items-center gap-2 text-fuchsia-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <p className="text-[11px] uppercase tracking-widest">{waitingLabel}</p>
        </div>
        <p className="text-[10px] text-gray-600">This updates automatically — no need to refresh.</p>
      </div>
    </div>
  );
}
