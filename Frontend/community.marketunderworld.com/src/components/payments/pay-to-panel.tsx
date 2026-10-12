"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Copy, ExternalLink, ImagePlus, X } from "lucide-react"
import { AppButton } from "@/components/ui/AppButton"
import { changePaymentNetwork, listPaymentMethods, type CategoryPayment, type PaymentNetworkInfo, type ProofUpload } from "@/lib/api/seller-access"
import { fileToProof, type ProofWithPreview } from "@/lib/image-proof"

const MAX_SHOTS = 3

/**
 * The "send exactly $X" block shared by payment screens: the address (or Binance QR) the payer was issued,
 * how long review takes, and the proof form (screenshot, transaction reference, or both).
 */
export function PayToPanel({ payment, amountUsd, busy, onSubmit }: {
  payment: CategoryPayment
  amountUsd: number
  busy: boolean
  onSubmit: (body: { txHash?: string; proofs?: ProofUpload[] }) => void
}) {
  const [hash, setHash] = useState("")
  const [shots, setShots] = useState<ProofWithPreview[]>([])
  const [shotError, setShotError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // The address and network belong together. Changing the network here re-issues both, and what is shown is always that pair.
  const [payTo, setPayTo] = useState(payment.payTo)
  const [networks, setNetworks] = useState<PaymentNetworkInfo[]>([])
  const [switching, setSwitching] = useState<string | null>(null)
  const [netError, setNetError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  useEffect(() => { setPayTo(payment.payTo); setConfirmed(false) }, [payment.id, payment.payTo?.address, payment.payTo?.network])
  useEffect(() => {
    if (payment.currency !== "USDT") return
    listPaymentMethods().then((m) => setNetworks(m.find((x) => x.method === "USDT")?.networks.filter((n) => n.available) ?? [])).catch(() => setNetworks([]))
  }, [payment.currency])
  const pay = payTo
  if (!pay) return null
  const isUsdt = payment.currency === "USDT"
  const chooseNetwork = async (network: string) => {
    if (network === pay.network || switching) return
    setSwitching(network); setNetError(null)
    try { const next = await changePaymentNetwork(payment.id, network); setPayTo(next.payTo); setConfirmed(false) }
    catch (e) { setNetError(e instanceof Error ? e.message : "Could not change the network. Nothing was changed.") }
    finally { setSwitching(null) }
  }
  const isBinance = payment.currency === "BINANCE"
  const usd = `$${amountUsd.toLocaleString()}`
  const wait = payment.review?.waitMinutes

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setShotError(null)
    try {
      const room = MAX_SHOTS - shots.length
      const next = await Promise.all(Array.from(files).slice(0, room).map((f) => fileToProof(f)))
      setShots((cur) => [...cur, ...next])
    } catch {
      setShotError("That file could not be read as an image. Try a screenshot (PNG or JPEG).")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const ready = (hash.trim().length >= 6 || shots.length > 0) && (!isUsdt || confirmed)
  return (
    <div className="space-y-4 p-4 rounded-lg bg-black/40 border border-white/10">
      <p className="text-xs text-gray-400">
        {isBinance
          ? <>Pay <strong className="text-white">{usd}</strong> in USDT with Binance Pay. Scan this QR in the Binance app — that is the safest way, because it goes straight to the right account:</>
          : <>Send exactly <strong className="text-white">{usd}</strong> worth of {pay.label}{pay.networkLabel && payment.currency === "USDT" ? <> on the <strong className="text-white">{pay.networkLabel}</strong> network</> : null} to:</>}
      </p>

      {isUsdt && (
        <div className="rounded-lg border-2 border-amber-500/60 bg-amber-500/5 p-3 space-y-3" role="group" aria-label="USDT network">
          <p className="flex items-start gap-2 text-sm text-amber-100"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <span>Send USDT <strong>only on the {pay.networkLabel || pay.network || "network shown"}</strong> network. If you send on any other network, the money is lost and cannot be recovered.</span></p>
          {networks.length > 1 && (
            <div>
              <p className="text-[11px] text-gray-400 mb-2">Your wallet or exchange sends on a different network? Choose it here. The address below changes with it.</p>
              <div className="flex flex-wrap gap-2">
                {networks.map((n) => (
                  <button key={n.network} type="button" onClick={() => chooseNetwork(n.network)} disabled={!!switching} aria-pressed={pay.network === n.network}
                    className={`px-3 h-9 rounded-lg text-xs font-bold border ${pay.network === n.network ? "bg-white text-black border-white" : "border-white/20 text-gray-200 hover:border-white/50"} disabled:opacity-60`}>
                    {switching === n.network ? "Changing…" : n.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {netError && <p role="alert" className="text-[11px] text-red-400">{netError}</p>}
        </div>
      )}

      {isBinance && pay.qrImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pay.qrImageUrl} alt="Binance Pay QR code" className="mx-auto w-full max-w-[280px] rounded-lg border border-white/10" />
      )}
      {isBinance && pay.payLink && (
        <a href={pay.payLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
          <ExternalLink className="w-3.5 h-3.5" /> Open in the Binance app
        </a>
      )}
      {isBinance && pay.address && (
        <p className="text-[11px] text-gray-400">Binance ID (UID) for this account: <code className="text-emerald-400 select-all">{pay.address}</code>
          {pay.recipient ? <> — the name Binance shows must be <strong className="text-white">{pay.recipient}</strong>. If it is a different name, stop and use the QR.</> : null}</p>
      )}
      {!isBinance && pay.address && (
        <div className="flex items-center gap-2">
          <code className="text-sm text-emerald-400 break-all flex-1 select-all">{pay.address}</code>
          <button aria-label="Copy address" onClick={() => navigator.clipboard?.writeText(pay.address ?? "")} className="text-gray-500 hover:text-white"><Copy className="w-4 h-4" /></button>
        </div>
      )}
      {pay.recipient && <p className="text-[11px] text-gray-400">Recipient name shown by Binance: <strong className="text-white">{pay.recipient}</strong></p>}
      {pay.address && !isBinance && <p className="text-[11px] text-gray-500">Check the address ends in <strong className="text-white font-mono">{pay.address.slice(-6)}</strong> before you send. A wrong network or address means the money is lost.</p>}

      <div className="space-y-2 pt-1 border-t border-white/10">
        <p className="text-[11px] text-gray-400">After you pay, attach a screenshot of the payment{isBinance ? "" : " (and the transaction hash if you have it)"}.
          {wait ? <> An admin checks it within about <strong className="text-white">{wait} minutes</strong>.</> : null}</p>
        <div className="flex flex-wrap gap-2">
          {shots.map((s, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt={`Screenshot ${i + 1}`} className="h-20 w-16 object-cover rounded-md border border-white/10" />
              <button aria-label="Remove screenshot" onClick={() => setShots((cur) => cur.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-black border border-white/20 rounded-full p-0.5 text-gray-300 hover:text-white"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {shots.length < MAX_SHOTS && (
            <button onClick={() => fileRef.current?.click()} className="h-20 w-16 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-[10px]">
              <ImagePlus className="w-5 h-5" /> Add
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addFiles(e.target.files)} aria-label="Attach payment screenshot" />
        </div>
        {shotError && <p className="text-[11px] text-red-400">{shotError}</p>}
        {isUsdt && (
          <label className="flex items-start gap-2 text-[12px] text-gray-200">
            <input type="checkbox" className="mt-0.5 accent-emerald-500" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I sent it on the <strong>{pay.networkLabel || pay.network}</strong> network, to the address that ends in <strong className="font-mono">{(pay.address || "").slice(-6)}</strong>.</span>
          </label>
        )}
        <input value={hash} onChange={(e) => setHash(e.target.value)} aria-label="Transaction reference"
          placeholder={isBinance ? "Binance Pay order ID (optional)" : "Transaction hash (optional with a screenshot)"}
          className="w-full h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white" />
        <AppButton onClick={() => onSubmit({ txHash: hash.trim() || undefined, proofs: shots.length ? shots.map(({ mime, data }) => ({ mime, data })) : undefined })}
          disabled={busy || !ready}>{busy ? "Sending…" : "I have paid — send for review"}</AppButton>
      </div>
    </div>
  )
}
