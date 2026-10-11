"use client"

import { useRef, useState } from "react"
import { Copy, ExternalLink, ImagePlus, X } from "lucide-react"
import { AppButton } from "@/components/ui/AppButton"
import type { CategoryPayment, ProofUpload } from "@/lib/api/seller-access"

const MAX_SHOTS = 3

// Phone screenshots are large; shrink to a readable JPEG before sending so the upload stays small and fast.
async function toProof(file: File): Promise<ProofUpload & { preview: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
  return { mime: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl }
}

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
  const [shots, setShots] = useState<(ProofUpload & { preview: string })[]>([])
  const [shotError, setShotError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pay = payment.payTo
  if (!pay) return null
  const isBinance = payment.currency === "BINANCE"
  const usd = `$${amountUsd.toLocaleString()}`
  const wait = payment.review?.waitMinutes

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setShotError(null)
    try {
      const room = MAX_SHOTS - shots.length
      const next = await Promise.all(Array.from(files).slice(0, room).map(toProof))
      setShots((cur) => [...cur, ...next])
    } catch {
      setShotError("That file could not be read as an image. Try a screenshot (PNG or JPEG).")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const ready = hash.trim().length >= 6 || shots.length > 0
  return (
    <div className="space-y-4 p-4 rounded-lg bg-black/40 border border-white/10">
      <p className="text-xs text-gray-400">
        {isBinance
          ? <>Pay <strong className="text-white">{usd}</strong> in USDT with Binance Pay. Scan this QR in the Binance app — that is the safest way, because it goes straight to the right account:</>
          : <>Send exactly <strong className="text-white">{usd}</strong> worth of {pay.label}{pay.networkLabel && payment.currency === "USDT" ? <> on the <strong className="text-white">{pay.networkLabel}</strong> network</> : null} to:</>}
      </p>

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
        <input value={hash} onChange={(e) => setHash(e.target.value)} aria-label="Transaction reference"
          placeholder={isBinance ? "Binance Pay order ID (optional)" : "Transaction hash (optional with a screenshot)"}
          className="w-full h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white" />
        <AppButton onClick={() => onSubmit({ txHash: hash.trim() || undefined, proofs: shots.length ? shots.map(({ mime, data }) => ({ mime, data })) : undefined })}
          disabled={busy || !ready}>{busy ? "Sending…" : "I have paid — send for review"}</AppButton>
      </div>
    </div>
  )
}
