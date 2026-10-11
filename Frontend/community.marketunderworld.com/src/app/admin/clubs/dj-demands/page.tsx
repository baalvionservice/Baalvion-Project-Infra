"use client"

import { useCallback, useEffect, useState } from "react"
import { adminApi, type Demand } from "@/lib/api/engagement"

const input = "bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-red-500"
const STATUSES = ["pending", "open", "confirmed", "closed", "rejected"]

export default function AdminDjDemandsPage() {
  const [status, setStatus] = useState("pending")
  const [items, setItems] = useState<Demand[]>([])
  const [target, setTarget] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  const load = useCallback(async () => {
    try { setError(""); setItems((await adminApi.demands(status)).items) } catch (e) { setError(e instanceof Error ? e.message : "Could not load") }
  }, [status])
  useEffect(() => { load() }, [load])

  const run = async (id: string, fn: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(id); setError("")
    try { await fn(); await load() } catch (e) { setError(e instanceof Error ? e.message : "Failed") } finally { setBusy("") }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">DJ demands</h1>
        <p className="text-sm text-gray-400 mt-1">Approve a proposal to open it for pledges. Confirm once the booking is agreed (held points become used). Closing refunds every held pledge.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm border ${status === s ? "bg-red-600 border-red-600 text-white" : "border-white/15 text-gray-300"}`}>{s}</button>)}
      </div>
      {error && <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-sm text-red-200">{error}</div>}
      {items.length === 0 && <p className="text-sm text-gray-500">Nothing here.</p>}
      {items.map((d) => (
        <section key={d.id} className="rounded-xl border border-white/10 p-5">
          <h3 className="font-semibold text-white">{d.djName}{d.genre ? ` · ${d.genre}` : ""}</h3>
          <p className="text-sm text-gray-400">{d.clubName}, {d.city}{d.state ? `, ${d.state}` : ""} · proposed by user {d.proposedBy}</p>
          {d.note && <p className="text-sm text-gray-300 mt-2">{d.note}</p>}
          <p className="text-sm text-gray-400 mt-2">{d.pledgedPoints.toLocaleString()} / {d.targetPoints.toLocaleString()} points from {d.pledgers} member(s)</p>
          <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
            {d.status === "pending" && (
              <>
                <input className={`${input} w-40`} inputMode="numeric" placeholder="Target points" value={target[d.id] || ""} onChange={(e) => setTarget({ ...target, [d.id]: e.target.value.replace(/\D/g, "") })} />
                <button disabled={busy === d.id} onClick={() => run(d.id, () => adminApi.approve(d.id, { targetPoints: Number(target[d.id] || 0) }))} className="bg-red-600 text-white px-4 py-2 rounded-lg">Approve and open</button>
                <button disabled={busy === d.id} onClick={() => run(d.id, () => adminApi.demandAction(d.id, "reject", window.prompt("Reason (shown to the member)") || undefined))} className="border border-white/20 text-white px-4 py-2 rounded-lg">Reject</button>
              </>
            )}
            {d.status === "open" && (
              <>
                <button disabled={busy === d.id} onClick={() => run(d.id, () => adminApi.demandAction(d.id, "confirm"), "Confirm the booking? Held pledges become used and can no longer be refunded here.")} className="bg-red-600 text-white px-4 py-2 rounded-lg">Confirm booking</button>
                <button disabled={busy === d.id} onClick={() => run(d.id, () => adminApi.demandAction(d.id, "close", "Closed by admin"), "Close and refund every held pledge?")} className="border border-red-500/40 text-red-300 px-4 py-2 rounded-lg">Close and refund</button>
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
