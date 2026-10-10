"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { AppButton } from "@/components/ui/AppButton"
import type { CategoryPayment } from "@/lib/api/seller-access"

/**
 * The "send exactly $X to this address" block shared by payment screens: the address and network the
 * payer was issued, the recipient name, a last-characters check, and the transaction-hash form.
 */
export function PayToPanel({ payment, amountUsd, busy, onSubmitHash }: {
  payment: CategoryPayment
  amountUsd: number
  busy: boolean
  onSubmitHash: (txHash: string) => void
}) {
  const [hash, setHash] = useState("")
  const pay = payment.payTo
  if (!pay) return null
  const usd = `$${amountUsd.toLocaleString()}`
  return (
    <div className="space-y-3 p-4 rounded-lg bg-black/40 border border-white/10">
      <p className="text-xs text-gray-400">
        {payment.currency === "BINANCE"
          ? <>Pay <strong className="text-white">{usd}</strong> in USDT with Binance Pay to this Binance Pay ID:</>
          : <>Send exactly <strong className="text-white">{usd}</strong> worth of {pay.label}{pay.networkLabel && payment.currency === "USDT" ? <> on the <strong className="text-white">{pay.networkLabel}</strong> network</> : null} to:</>}
      </p>
      <div className="flex items-center gap-2">
        <code className="text-sm text-emerald-400 break-all flex-1 select-all">{pay.address}</code>
        <button aria-label="Copy address" onClick={() => navigator.clipboard?.writeText(pay.address ?? "")} className="text-gray-500 hover:text-white"><Copy className="w-4 h-4" /></button>
      </div>
      {pay.recipient && <p className="text-[11px] text-gray-400">Recipient name shown by Binance: <strong className="text-white">{pay.recipient}</strong></p>}
      {pay.address && <p className="text-[11px] text-gray-500">Check the address ends in <strong className="text-white font-mono">{pay.address.slice(-6)}</strong> before you send. A wrong network or address cannot be recovered.</p>}
      <p className="text-[11px] text-gray-500">{payment.currency === "BINANCE" ? "Then paste the Binance Pay order or transaction ID below" : "Then paste the transaction hash below"} so the admin can verify it.</p>
      <div className="flex gap-2">
        <input value={hash} onChange={(e) => setHash(e.target.value)} aria-label="Transaction reference"
          placeholder={payment.currency === "BINANCE" ? "Binance Pay order / transaction ID" : "Transaction hash"}
          className="flex-1 h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white" />
        <AppButton onClick={() => onSubmitHash(hash.trim())} disabled={busy || hash.trim().length < 8}>Submit</AppButton>
      </div>
    </div>
  )
}
