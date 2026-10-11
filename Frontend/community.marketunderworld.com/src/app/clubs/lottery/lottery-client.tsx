"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Ticket, Trophy, Loader2 } from "lucide-react"
import { listDraws, myEntries, enterDraw, type Draw, type MyEntry } from "@/lib/api/engagement"

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

export function LotteryClient() {
  const [draws, setDraws] = useState<Draw[] | null>(null)
  const [mine, setMine] = useState<MyEntry[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [signedIn, setSignedIn] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [adult, setAdult] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setDraws((await listDraws()).items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load draws")
      setDraws([])
    }
    try {
      const m = await myEntries()
      setMine(m.items)
      setBalance(m.balance)
      setSignedIn(true)
    } catch {
      setSignedIn(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const enter = async (d: Draw, count: number) => {
    setBusy(d.id)
    setMsg(null)
    try {
      const r = await enterDraw(d.id, count)
      setMsg({ ok: true, text: `You are in. Ticket${r.tickets.length > 1 ? "s" : ""} ${r.tickets.map((n) => `#${n}`).join(", ")}. ${r.pointsSpent.toLocaleString()} points spent.` })
      await load()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not enter" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans text-[#222]">
      <Navbar />
      <main className="container max-w-[900px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: "Ticket draw" }]} /></div>
        <h1 className="text-3xl font-bold mb-2">Club ticket draw</h1>
        <p className="text-gray-600 mb-6">Pay $6 for an entry and you are in the monthly draw for your state. When the draw closes, 1,000 winners are picked at random and win a free VIP club ticket. Winners are listed here by member number. You pay with wallet points (100 points = $1), and if a draw is cancelled every entry is refunded. 18 and over only.</p>

        {signedIn ? (
          <p className="mb-6 text-sm text-gray-700">Your wallet: <b>{(balance ?? 0).toLocaleString()} points</b> · <Link className="underline" href="/payments">Load wallet</Link></p>
        ) : (
          <p className="mb-6 text-sm text-gray-700"><Link className="underline" href="/auth/signin">Sign in</Link> to enter a draw.</p>
        )}
        <label className="mb-6 flex items-start gap-3 text-sm text-gray-800">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1" />
          <span>I confirm I am 18 or older. Entry is for adults only.</span>
        </label>
        {msg && <div className={`mb-6 p-3 text-sm rounded border ${msg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{msg.text}</div>}
        {error && <div className="mb-6 p-3 text-sm rounded border bg-red-50 border-red-200 text-red-800">{error}</div>}

        {draws === null ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : draws.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 text-center text-gray-600">No draw is running right now. Check back soon.</div>
        ) : (
          <div className="space-y-5">
            {draws.map((d) => {
              const held = mine.filter((e) => e.drawId === d.id && e.status === "active")
              const left = d.maxEntriesPerUser - held.length
              return (
                <section key={d.id} className="bg-white border border-gray-200 p-6">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{d.title}{d.state ? <span className="ml-2 text-xs font-bold uppercase align-middle px-2 py-0.5 border border-gray-300">{d.state}</span> : null}</h2>
                      <p className="text-gray-700 mt-1">Prize: {d.prize}</p>
                      <p className="text-sm text-gray-500 mt-1">{d.winnersCount} winner{d.winnersCount > 1 ? "s" : ""} · {d.entries} entr{d.entries === 1 ? "y" : "ies"} from {d.members} member{d.members === 1 ? "" : "s"}</p>
                    </div>
                    <span className="text-xs font-bold uppercase self-start px-3 py-1 border border-gray-300">{d.status === "open" ? "Open" : d.status === "drawn" ? "Drawn" : "Closed"}</span>
                  </div>

                  {d.status === "open" && (
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="text-sm">{d.entryPoints === 0 ? "Free entry" : `$${(d.entryPoints / 100).toFixed(2).replace(/\.00$/, "")} per entry (${d.entryPoints.toLocaleString()} points)`} · closes {when(d.closesAt)}</span>
                      {signedIn && left > 0 && (
                        <button disabled={busy === d.id || !adult} onClick={() => enter(d, 1)} className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">
                          {busy === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />} Enter once
                        </button>
                      )}
                      {signedIn && left === 0 && <span className="text-sm text-gray-500">You have used all {d.maxEntriesPerUser} entries.</span>}
                    </div>
                  )}
                  {held.length > 0 && <p className="mt-3 text-sm text-gray-700">Your tickets: {held.map((e) => `#${e.ticketNo}`).join(", ")}</p>}

                  {d.status === "drawn" && (
                    <div className="mt-5">
                      <h3 className="font-bold flex items-center gap-2"><Trophy className="w-4 h-4" /> Winners</h3>
                      <ul className="mt-2 text-sm space-y-1">
                        {d.winners.map((w) => <li key={w.position}>{w.position}. Member #{w.memberNumber ?? "—"} · ticket #{w.ticketNo}</li>)}
                      </ul>
                      {held.some((e) => e.won) && <p className="mt-3 text-sm font-bold text-green-700">You won. The Baalvion team will contact you to hand over your prize.</p>}
                      {d.drawSeed && <p className="mt-3 text-xs text-gray-500 break-all">Draw seed: {d.drawSeed}. Entries are ranked by HMAC-SHA256 of the entry id with this seed; the first {d.winnersCount} distinct members win.</p>}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
