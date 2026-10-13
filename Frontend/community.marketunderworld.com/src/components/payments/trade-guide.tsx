"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Intermediary } from "@/lib/api/intermediaries"

interface Rate { ok: boolean; usd?: number; inr?: number | null; aed?: number | null; at?: string; source?: string; exact?: boolean }
const OPEN_TRADES = 5
const fmt = (n: number, cur: string) => new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: cur === "USD" ? 2 : 0 }).format(n)

// Everything a buyer should know before pressing "Request a trade": roughly what it costs at today's USDT price, and what they need.
export function TradeGuide({ item }: { item: Intermediary }) {
  const { isAuthenticated } = useAuth()
  const [rate, setRate] = useState<Rate | null>(null)
  const [amount, setAmount] = useState("100")
  const [currency, setCurrency] = useState<"INR" | "AED" | "USD">("INR")

  useEffect(() => { fetch("/api/usdt-rate").then((r) => r.json()).then(setRate).catch(() => setRate({ ok: false })) }, [])
  const usdt = Math.max(0, Number(amount) || 0)
  const limit = item.tradeLimitUsd ?? null
  const overLimit = limit !== null && usdt > limit

  // A fee written as a percentage ("2%") gives an estimate. Anything else is shown as the intermediary wrote it.
  const pct = useMemo(() => {
    const m = [...(item.commissionNote ?? "").matchAll(/(\d+(?:\.\d+)?)\s*%/g)]
    return m.length === 1 ? Number(m[0][1]) : null
  }, [item.commissionNote])

  const per = rate?.ok ? (currency === "INR" ? rate.inr : currency === "AED" ? rate.aed : rate.usd) ?? null : null
  const value = per ? usdt * per : null
  const fee = value !== null && pct !== null ? (value * pct) / 100 : null

  return (
    <section aria-label="Know before you start" className="grid lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold">What it will cost</h2>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <label className="text-sm"><span className="text-zinc-400">How much USDT do you need?</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Amount in USDT" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-base" />
          </label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-800" role="group" aria-label="Show the price in">
            {(["INR", "AED", "USD"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`px-3 h-11 text-xs font-bold ${currency === c ? "bg-white text-black" : "bg-zinc-950 text-zinc-300"}`}>{c}</button>
            ))}
          </div>
        </div>

        {rate === null ? <p className="text-sm text-zinc-500">Getting today&apos;s USDT price…</p> : !rate.ok || !per ? (
          <p className="text-sm text-amber-300">Today&apos;s USDT price could not be loaded right now. The intermediary will tell you the exact price in the trade chat before you pay.</p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-zinc-400">Today&apos;s price of 1 USDT</dt><dd className="font-semibold">{fmt(per, currency)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-400">{usdt || 0} USDT is about</dt><dd className="font-semibold">{value !== null ? fmt(value, currency) : "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-400">Their fee</dt><dd className="text-right font-semibold">{item.commissionNote || "Agreed in the trade chat"}{fee !== null ? <span className="block text-xs font-normal text-zinc-400">about {fmt(fee, currency)} at {pct}%</span> : null}</dd></div>
            {fee !== null && value !== null && <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2"><dt className="text-zinc-300">You would pay about</dt><dd className="font-bold text-emerald-300">{fmt(value + fee, currency)}</dd></div>}
          </dl>
        )}
        {overLimit && <p role="alert" className="text-sm text-red-300">This intermediary takes trades up to ${limit!.toLocaleString()}. Lower the amount or choose another intermediary.</p>}
        <p className="text-[11px] text-zinc-500 leading-snug">A guide only{rate?.ok && rate.at ? `, price from ${rate.source} at ${new Date(rate.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${rate.exact === false ? " (a general exchange rate, not the USDT market price)" : ""}` : ""}. The exact price and fee are agreed with the intermediary in the trade chat, <strong className="text-zinc-300">before you pay</strong>. Never pay before you have agreed the amount.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold">What you need</h2>
        <ul className="space-y-2.5 text-sm">
          <Need done={isAuthenticated} text={<>A Hell Road account. {isAuthenticated ? "You are signed in." : <><Link href={`/auth/signin?redirect=/escrow/intermediaries/${item.slug}`} className="underline text-red-300">Sign in</Link> or create one first.</>}</>} />
          <Need done text={<>Nothing else to start. <strong className="text-white">No access pass and no deposit</strong> is needed to request a trade. (Your account still has to be verified within 7 days of joining, like every member.)</>} />
          {item.qrs.length > 0 && <Need text={<>A way to pay them. They take payment by QR: open any UPI app and scan, and check the name shown is <strong className="text-white">{item.displayName}</strong>.</>} />}
          <Need text={<>Where the USDT should go. For your own wallet, give them your wallet address and network. To pay Hell Road (a membership, the wallet or a category), ask them to send it to the address shown on that payment page.</>} />
          <Need text={<>A screenshot of your payment. You attach it in the trade chat so the intermediary and the admin can see it.</>} />
          {limit !== null && <Need text={<>Stay within <strong className="text-white">${limit.toLocaleString()}</strong> for one trade.</>} />}
          <Need text={<>You can have up to <strong className="text-white">{OPEN_TRADES}</strong> trades open at a time.</>} />
        </ul>
        {item.depositUsd > 0 && <p className="text-xs text-emerald-300/90">This intermediary has a refundable deposit of ${item.depositUsd.toLocaleString()} held by the platform. If a trade is disputed and the admin decides for you, a refund can come from it.</p>}
      </div>
    </section>
  )
}

function Need({ done = false, text }: { done?: boolean; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      {done ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 mt-0.5 text-zinc-600 shrink-0" />}
      <span className="text-zinc-300 leading-snug">{text}</span>
    </li>
  )
}
