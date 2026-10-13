"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { acceptTradeQuote, requoteTrade, sendTradeMessage, sendTradeQuote, tradeQrUrl, type QuoteCurrency, type TradeDetail, type TradeQuote } from "@/lib/api/intermediaries"

export const money = (n: number, cur: string) => new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: cur === "INR" ? 0 : 2 }).format(n)

function useCountdown(iso: string | null) {
  const [left, setLeft] = useState(() => (iso ? Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)) : 0))
  useEffect(() => {
    if (!iso) { setLeft(0); return }
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)))
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [iso])
  return left
}

// Every number of the price on one card, so nothing is left to guess.
export function QuoteBreakdown({ q }: { q: TradeQuote }) {
  const rows: [string, string, boolean?][] = []
  if (q.usdt) rows.push(["USDT you get", `${q.usdt} USDT`])
  if (q.ratePerUsdt) rows.push([`Price of 1 USDT${q.source ? ` (${q.source}, ${new Date(q.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}`, money(q.ratePerUsdt, q.currency)])
  if (q.valueLocal !== undefined) rows.push(["Value of the USDT", money(q.valueLocal, q.currency)])
  if (q.feeLocal !== undefined) rows.push([q.feePercent ? `Intermediary fee (${q.feePercent}%)` : "Intermediary fee", q.feePercent ? money(q.feeLocal, q.currency) : "None"])
  rows.push(["You pay the intermediary", money(q.totalLocal, q.currency), true])
  return (
    <dl className="rounded-lg border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800 text-sm">
      {rows.map(([k, v, strong]) => (
        <div key={k} className={`flex justify-between gap-4 px-3 py-2.5 ${strong ? "bg-emerald-500/5" : ""}`}><dt className="text-zinc-400">{k}</dt><dd className={strong ? "text-lg font-bold text-emerald-300" : "font-semibold"}>{v}</dd></div>
      ))}
      {q.note && <div className="px-3 py-2 text-xs text-zinc-400">Note from the intermediary: {q.note}</div>}
    </dl>
  )
}

// The price and the scanner for one trade. The scanner shows only after the price is locked.
export function QuotePanel({ d, isCustomer, isInt, run, busy }: { d: TradeDetail; isCustomer: boolean; isInt: boolean; run: (fn: () => Promise<TradeDetail>, ok?: string) => void | Promise<void>; busy: boolean }) {
  const left = useCountdown(d.quoteLive ? d.quoteExpiresAt : null)
  const [cur, setCur] = useState<QuoteCurrency>(d.quote?.currency ?? "INR")
  const [total, setTotal] = useState("")
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState("")
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0")
  const q = d.quote
  const showsScanner = isCustomer && d.status === "created" && d.payQrs.length > 0 && (d.quoteLive || !d.quoteRequired)

  // Customer
  if (isCustomer && d.status === "created" && d.quoteRequired) {
    if (!q) return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
        <p className="text-sm font-semibold text-amber-200 flex items-center gap-2"><Clock className="w-4 h-4" /> Waiting for {d.intermediary.name} to send you a price</p>
        <p className="text-xs text-zinc-300">This intermediary has no fixed fee, so they send you the final price here. You will see every number, and the scanner appears only after you accept it. Do not pay before that.</p>
      </div>
    )
    if (!d.quoteAcceptedAt) return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">{d.intermediary.name} sent you this price. Check every line, then accept it.</p>
        <QuoteBreakdown q={q} />
        <button disabled={busy} onClick={() => run(() => acceptTradeQuote(d.id), "Price accepted")} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-3 rounded-lg text-sm font-bold">Accept this price and show the scanner</button>
        <p className="text-[11px] text-zinc-500">Not right? Say so in the chat and ask for a new price. Nothing is paid until you scan.</p>
      </div>
    )
    if (!d.quoteLive) return (
      <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <p className="text-sm font-semibold text-red-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> This price has expired</p>
        <p className="text-xs text-zinc-300">Prices are locked for 30 minutes so the rate cannot change while you pay. Do not pay the old amount.</p>
        {q && <QuoteBreakdown q={q} />}
        {q?.by === "system"
          ? <button disabled={busy} onClick={() => run(() => requoteTrade(d.id), "New price locked")} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-bold">Get today&apos;s price and lock it</button>
          : <button disabled={busy} onClick={() => run(() => sendTradeMessage(d.id, "My price has expired. Please send me a new price."), "Asked for a new price")} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-bold">Ask {d.intermediary.name} for a new price</button>}
      </div>
    )
  }

  // Customer with a locked price: the final amount, then the scanner.
  if (showsScanner && q) return (
    <div className="space-y-4 rounded-lg border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Price locked. Pay exactly this.</p>
        {d.quoteRequired && <p className="text-xs text-zinc-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Valid for {mm}:{ss}</p>}
      </div>
      <p className="text-3xl font-black">{money(q.totalLocal, q.currency)}</p>
      <QuoteBreakdown q={q} />
      <div className="space-y-3">
        <p className="text-sm text-zinc-200">1. Open any UPI app and scan. 2. Check the name shown is <strong className="text-white">{d.intermediary.name}</strong>. 3. Pay exactly <strong className="text-white">{money(q.totalLocal, q.currency)}</strong>. 4. Press <strong className="text-white">I have paid</strong> and attach the screenshot.</p>
        <div className="flex flex-wrap gap-4">
          {d.payQrs.map((x) => (
            <div key={x.id} className="space-y-1">
              <p className="text-xs font-bold">{x.label}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tradeQrUrl(d.id, x.id)} alt={`${d.intermediary.name} ${x.label} QR`} className="w-48 h-48 rounded-md border border-zinc-800 bg-white object-contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Intermediary: send or see the price
  if (isInt && d.status === "created" && d.quoteRequired) {
    if (q && d.quoteLive) return <div className="space-y-2"><p className="text-sm font-semibold text-emerald-300">The customer locked this price and can now pay.</p><QuoteBreakdown q={q} /></div>
    if (q && !d.quoteAcceptedAt) return <div className="space-y-2"><p className="text-sm font-semibold text-amber-200">You sent this price. Waiting for the customer to accept it.</p><QuoteBreakdown q={q} /></div>
    const send = () => {
      const n = Number(total)
      if (!n || n <= 0) { setFormError("Enter the total the customer must pay you."); return }
      setFormError("")
      run(() => sendTradeQuote(d.id, { currency: cur, totalLocal: n, usdt: d.amountUsdt ?? undefined, note: note.trim() || undefined }), "Price sent")
    }
    return (
      <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
        <p className="text-sm font-semibold">Send the customer a final price</p>
        <p className="text-xs text-zinc-400">{d.amountUsdt ? `They asked for ${d.amountUsdt} USDT. ` : ""}Put in the total they must pay you, everything included. They see it, accept it, and only then does your scanner appear to them.</p>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <select value={cur} onChange={(e) => setCur(e.target.value as QuoteCurrency)} aria-label="Currency" className="bg-zinc-900 border border-zinc-800 rounded p-2.5 text-sm"><option>INR</option><option>AED</option><option>USD</option></select>
          <input value={total} onChange={(e) => setTotal(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="Total the customer pays you" aria-label="Total" className="bg-zinc-900 border border-zinc-800 rounded p-2.5 text-sm" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="A note for the customer (optional), e.g. rate and fee" aria-label="Note" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-sm" />
        {formError && <p role="alert" className="text-xs text-red-300">{formError}</p>}
        <button disabled={busy} onClick={send} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Send this price</button>
      </div>
    )
  }

  // After the customer has paid: keep the agreed price in view.
  if (q && d.quoteAcceptedAt) return <div className="space-y-2"><p className="text-sm font-semibold text-zinc-200">Agreed price</p><QuoteBreakdown q={q} /></div>
  return null
}
