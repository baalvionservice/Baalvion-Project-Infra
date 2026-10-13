"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Intermediary, QuoteCurrency } from "@/lib/api/intermediaries"

interface Rate { ok: boolean; usd?: number; inr?: number | null; aed?: number | null; at?: string; source?: string; exact?: boolean }
const OPEN_TRADES = 5
const fmt = (n: number, cur: string) => new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: cur === "USD" ? 2 : 0 }).format(n)

// Everything a buyer should know before pressing "Request a trade": roughly what it costs at today's USDT price, and what they need.
export function TradeGuide({ item, onLock, locking }: { item: Intermediary; onLock: (amount: number, currency: QuoteCurrency) => void; locking: boolean }) {
  const { isAuthenticated } = useAuth()
  const [rate, setRate] = useState<Rate | null>(null)
  const [amount, setAmount] = useState("100")
  const [currency, setCurrency] = useState<"INR" | "AED" | "USD">("INR")

  useEffect(() => { fetch("/api/usdt-rate").then((r) => r.json()).then(setRate).catch(() => setRate({ ok: false })) }, [])
  const usdt = Math.max(0, Number(amount) || 0)
  const limit = item.tradeLimitUsd ?? null
  const overLimit = limit !== null && usdt > limit

  // A fee written as a percentage ("2%") gives an estimate. Anything else is shown as the intermediary wrote it.
  const pct = useMemo(() => (item.feePercent !== null && item.feePercent !== undefined ? item.feePercent : null), [item.feePercent])

  const per = rate?.ok ? (currency === "INR" ? rate.inr : currency === "AED" ? rate.aed : rate.usd) ?? null : null
  const value = per ? usdt * per : null
  const fee = value !== null && pct !== null ? (value * pct) / 100 : null

  const steps = [
    ["Choose the amount", "Type how many USDT you want."],
    ["Lock the price", "You see the full total. It is fixed for 30 minutes."],
    ["Scan and pay", `The scanner appears next to the exact amount. Pay only that.`],
    ["Get your USDT", `Send your wallet address in the chat. ${item.displayName} sends the USDT.`],
  ]

  return (
    <section aria-label="How buying USDT works" className="mb-8 space-y-6">
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(([t, d], i) => (
          <li key={t} className={`rounded-xl border p-4 ${i === 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900"}`}>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold mb-2">{i + 1}</span>
            <p className="font-bold text-sm">{t}</p>
            <p className="text-xs text-zinc-400 mt-1 leading-snug">{d}</p>
          </li>
        ))}
      </ol>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
        <h2 className="text-lg font-bold">Step 1. Choose the amount</h2>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <label className="text-sm"><span className="text-zinc-400">How many USDT do you want?</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Amount in USDT" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-base" />
          </label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-800" role="group" aria-label="Pay in">
            {(["INR", "AED", "USD"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`px-3 h-11 text-xs font-bold ${currency === c ? "bg-white text-black" : "bg-zinc-950 text-zinc-300"}`}>{c}</button>
            ))}
          </div>
        </div>

        {rate === null ? <p className="text-sm text-zinc-500">Getting today&apos;s USDT price…</p> : !rate.ok || !per ? (
          <p className="text-sm text-amber-300">Today&apos;s USDT price could not be loaded right now. Ask for a price below and {item.displayName} will send you the exact total.</p>
        ) : pct !== null ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-zinc-400">{usdt || 0} USDT at today&apos;s price ({fmt(per, currency)} each)</dt><dd className="font-semibold">{value !== null ? fmt(value, currency) : "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-400">{item.displayName}&apos;s fee ({pct}%)</dt><dd className="font-semibold">{fee !== null ? fmt(fee, currency) : "—"}</dd></div>
            {fee !== null && value !== null && <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2"><dt className="text-zinc-200 font-semibold">You pay in total</dt><dd className="text-xl font-bold text-emerald-300">{fmt(value + fee, currency)}</dd></div>}
          </dl>
        ) : null}
        {overLimit && <p role="alert" className="text-sm text-red-300">{item.displayName} takes trades up to ${limit!.toLocaleString()}. Lower the amount or choose another intermediary.</p>}

        {pct !== null ? (
          <button type="button" disabled={locking || !usdt || !per || overLimit} onClick={() => onLock(usdt, currency)} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 font-bold text-sm">{locking ? "Locking…" : "Step 2. Lock this price"}</button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-amber-200">{item.displayName} has not set a fee yet. Ask for a price: they send you the final total, you accept it, and then the scanner appears.</p>
            <button type="button" disabled={locking || !usdt || overLimit} onClick={() => onLock(usdt, currency)} className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-bold text-sm">{locking ? "Sending…" : "Ask for a price"}</button>
          </div>
        )}
        <p className="text-xs text-zinc-500 leading-snug">Nothing is paid yet. Locking only fixes the price{rate?.ok && rate.at ? ` (rate from ${rate.source}${rate.exact === false ? ", a general exchange rate" : ""})` : ""}.</p>
      </div>

      <ul className="space-y-2 text-sm max-w-2xl">
        <Need done={isAuthenticated} text={isAuthenticated ? "You are signed in." : <><Link href={`/auth/signin?redirect=/escrow/intermediaries/${item.slug}`} className="underline text-red-300">Sign in</Link> first so we can save your trade.</>} />
        <Need done text={<>No access pass or deposit is needed. Up to {OPEN_TRADES} trades can be open at once.{limit !== null ? <> One trade can be up to ${limit.toLocaleString()}.</> : null}</>} />
      </ul>
    </section>
  )
}

function Need({ done = false, text }: { done?: boolean; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${done ? "text-emerald-400" : "text-zinc-600"}`} />
      <span className="text-zinc-300 leading-snug">{text}</span>
    </li>
  )
}
