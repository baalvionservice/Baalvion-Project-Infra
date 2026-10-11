"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Loader2 } from "lucide-react"
import { listDemands, myDemandActivity, proposeDemand, pledgeToDemand, withdrawPledge, type Demand, type MyPledge } from "@/lib/api/engagement"

const input = "w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-black"

export function DjDemandClient() {
  const [items, setItems] = useState<Demand[] | null>(null)
  const [minPledge, setMinPledge] = useState(100)
  const [pledges, setPledges] = useState<MyPledge[]>([])
  const [proposals, setProposals] = useState<Demand[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [signedIn, setSignedIn] = useState(true)
  const [amount, setAmount] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState({ djName: "", genre: "", clubName: "", city: "", state: "", note: "" })

  const load = useCallback(async () => {
    try {
      const r = await listDemands()
      setItems(r.items)
      setMinPledge(r.minPledgePoints)
    } catch (e) {
      setItems([])
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not load demands" })
    }
    try {
      const m = await myDemandActivity()
      setPledges(m.pledges)
      setProposals(m.proposals)
      setBalance(m.balance)
      setSignedIn(true)
    } catch {
      setSignedIn(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const act = async (key: string, fn: () => Promise<unknown>, okText: string) => {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      setMsg({ ok: true, text: okText })
      await load()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" })
    } finally {
      setBusy(null)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    act("propose", async () => {
      await proposeDemand({ djName: form.djName, clubName: form.clubName, city: form.city, genre: form.genre || undefined, state: form.state || undefined, note: form.note || undefined })
      setForm({ djName: "", genre: "", clubName: "", city: "", state: "", note: "" })
    }, "Sent. An admin will review it before it opens for pledges.")
  }

  const held = (id: string) => pledges.find((p) => p.demandId === id && p.status === "held")

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans text-[#222]">
      <Navbar />
      <main className="container max-w-[900px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: "Demand your DJ" }]} /></div>
        <h1 className="text-3xl font-bold mb-2">Demand your DJ</h1>
        <p className="text-gray-600 mb-6">Suggest a DJ for a club. Once an admin opens it, members pledge wallet points. Pledged points stay held: if the booking is confirmed they are used for it, and if the demand is closed they come back to your wallet. You can also take a pledge back while the demand is open.</p>

        {signedIn
          ? <p className="mb-6 text-sm">Your wallet: <b>{(balance ?? 0).toLocaleString()} points</b> · <Link className="underline" href="/payments">Load wallet</Link></p>
          : <p className="mb-6 text-sm"><Link className="underline" href="/auth/signin">Sign in</Link> to propose or pledge.</p>}
        {msg && <div className={`mb-6 p-3 text-sm border ${msg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{msg.text}</div>}

        {items === null ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 text-center text-gray-600 mb-8">No demand is open yet. Propose the first one below.</div>
        ) : (
          <div className="space-y-4 mb-10">
            {items.map((d) => {
              const pct = Math.min(100, Math.round((d.pledgedPoints / Math.max(1, d.targetPoints)) * 100))
              const mine = held(d.id)
              return (
                <section key={d.id} className="bg-white border border-gray-200 p-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold">{d.djName}{d.genre ? <span className="font-normal text-gray-500"> · {d.genre}</span> : null}</h2>
                      <p className="text-sm text-gray-600">{d.clubName}, {d.city}{d.state ? `, ${d.state}` : ""}</p>
                      {d.note && <p className="text-sm text-gray-700 mt-2">{d.note}</p>}
                    </div>
                    <span className="text-xs font-bold uppercase self-start px-3 py-1 border border-gray-300">{d.status === "confirmed" ? "Confirmed" : "Open"}</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200"><div className="h-2 bg-black" style={{ width: `${pct}%` }} /></div>
                    <p className="text-xs text-gray-600 mt-1">{d.pledgedPoints.toLocaleString()} of {d.targetPoints.toLocaleString()} points · {d.pledgers} member{d.pledgers === 1 ? "" : "s"}</p>
                  </div>
                  {d.status === "open" && signedIn && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <input className={`${input} max-w-[160px]`} inputMode="numeric" placeholder={`Points (min ${minPledge})`} value={amount[d.id] || ""} onChange={(e) => setAmount({ ...amount, [d.id]: e.target.value.replace(/\D/g, "") })} />
                      <button disabled={busy === d.id} onClick={() => act(d.id, () => pledgeToDemand(d.id, Number(amount[d.id] || 0)), "Pledge recorded.")} className="bg-black text-white text-sm font-bold px-5 py-2.5 disabled:opacity-50">Pledge</button>
                      {mine && <button disabled={busy === d.id} onClick={() => act(d.id, () => withdrawPledge(d.id), "Your pledge is back in your wallet.")} className="border border-gray-400 text-sm font-bold px-4 py-2.5">Take my pledge back</button>}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {signedIn && (pledges.length > 0 || proposals.length > 0) && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-3">Your activity</h2>
            <ul className="text-sm space-y-1">
              {proposals.map((p) => <li key={p.id}>Proposal: {p.djName} at {p.clubName} — {p.status}{p.decisionNote ? ` (${p.decisionNote})` : ""}</li>)}
              {pledges.map((p) => <li key={p.id}>Pledge: {p.points.toLocaleString()} points for {p.djName} at {p.clubName} — {p.status === "held" ? "held" : p.status === "applied" ? "used for the booking" : "refunded"}</li>)}
            </ul>
          </section>
        )}

        {signedIn && (
          <form onSubmit={submit} className="bg-white border border-gray-200 p-5 space-y-3">
            <h2 className="text-lg font-bold">Propose a DJ</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required className={input} placeholder="DJ or artist name" value={form.djName} onChange={(e) => setForm({ ...form, djName: e.target.value })} />
              <input className={input} placeholder="Genre (optional)" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
              <input required className={input} placeholder="Club" value={form.clubName} onChange={(e) => setForm({ ...form, clubName: e.target.value })} />
              <input required className={input} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className={input} placeholder="State (optional)" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <textarea className={input} rows={3} maxLength={600} placeholder="Why this DJ at this club? (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <button disabled={busy === "propose"} className="bg-black text-white text-sm font-bold px-6 py-2.5 disabled:opacity-50">Send for review</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
