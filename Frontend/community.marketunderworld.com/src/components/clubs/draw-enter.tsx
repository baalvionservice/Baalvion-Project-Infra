"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Ticket } from "lucide-react"
import { enterDraw, myEntries, type MyEntry } from "@/lib/api/engagement"

// Entering one draw from its own page: sign-in state, wallet, the 18+ tick and the entry button.
export function DrawEnter({ drawId, maxEntries, entryPoints }: { drawId: string; maxEntries: number; entryPoints: number }) {
  const [mine, setMine] = useState<MyEntry[] | null>(null)
  const [balance, setBalance] = useState(0)
  const [signedIn, setSignedIn] = useState(true)
  const [adult, setAdult] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = () => myEntries().then((m) => { setMine(m.items.filter((e) => e.drawId === drawId && e.status === "active")); setBalance(m.balance); setSignedIn(true) }).catch(() => { setSignedIn(false); setMine([]) })
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (mine === null) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
  if (!signedIn) return <p className="text-sm"><Link className="underline font-semibold" href={`/auth/signin?redirect=/clubs/lottery/${drawId}`}>Sign in</Link> to enter this draw.</p>
  const left = maxEntries - mine.length
  const enter = async () => {
    setBusy(true); setMsg(null)
    try { const r = await enterDraw(drawId, 1); setMsg({ ok: true, text: `You are in. Ticket ${r.tickets.map((n) => `#${n}`).join(", ")}. ${r.pointsSpent.toLocaleString()} points spent.` }); await load() }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not enter" }) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">Your wallet: <b>{balance.toLocaleString()} points</b>{balance < entryPoints && <> · <Link className="underline" href="/payments">Load wallet</Link></>}</p>
      {mine.length > 0 && <p className="text-sm">Your tickets: {mine.map((e) => `#${e.ticketNo}`).join(", ")}</p>}
      {left > 0 ? (
        <>
          <label className="flex items-start gap-3 text-sm text-gray-800"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1" /> <span>I confirm I am 18 or older. Entry is for adults only.</span></label>
          <button disabled={busy || !adult} onClick={enter} className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-6 py-3 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />} Enter once</button>
        </>
      ) : <p className="text-sm text-gray-500">You have used all {maxEntries} entries.</p>}
      {msg && <div className={`p-3 text-sm rounded border ${msg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{msg.text}</div>}
    </div>
  )
}
