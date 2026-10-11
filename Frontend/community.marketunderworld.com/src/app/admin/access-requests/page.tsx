"use client"

import { useCallback, useEffect, useState } from "react"
import { DEPARTMENTS, adminRequests, decideRequest, type AdminAccessRequest } from "@/lib/api/profile"
import { INTERESTS } from "@/lib/interests"

const label = (k: string) => DEPARTMENTS.find((d) => d.key === k)?.label ?? k
const STATUSES = ["pending", "approved", "declined"]

export default function AdminAccessRequestsPage() {
  const [status, setStatus] = useState("pending")
  const [items, setItems] = useState<AdminAccessRequest[]>([])
  const [note, setNote] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  const load = useCallback(async () => {
    try { setError(""); setItems(await adminRequests(status)) } catch (e) { setError(e instanceof Error ? e.message : "Could not load") }
  }, [status])
  useEffect(() => { load() }, [load])

  const decide = async (id: string, approve: boolean) => {
    setBusy(id); setError("")
    try { await decideRequest(id, approve, note[id] || undefined); await load() } catch (e) { setError(e instanceof Error ? e.message : "Failed") } finally { setBusy("") }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Department requests</h1>
        <p className="text-sm text-gray-400 mt-1">Members asking to join a team. Approving records your decision and tells the member. To give the person actual permissions, add them in Staff.</p>
      </header>
      <div className="flex gap-2">
        {STATUSES.map((s) => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm border ${status === s ? "bg-red-600 border-red-600 text-white" : "border-white/15 text-gray-300"}`}>{s}</button>)}
      </div>
      {error && <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-sm text-red-200">{error}</div>}
      {items.length === 0 && <p className="text-sm text-gray-500">Nothing here.</p>}
      {items.map((r) => (
        <section key={r.id} className="rounded-xl border border-white/10 p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold text-white">{label(r.department)}</h3>
            <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{r.requesterLabel || `User ${r.userId}`}{r.requesterCity ? ` · ${r.requesterCity}` : ""}</p>
          <p className="text-sm text-gray-200 mt-3 whitespace-pre-line">{r.message}</p>
          {(r.requesterBio || r.requesterInterests.length > 0) && (
            <p className="text-xs text-gray-500 mt-3">{r.requesterBio}{r.requesterInterests.length > 0 ? ` · Interested in: ${r.requesterInterests.map((i) => INTERESTS.find((x) => x.id === i)?.title ?? i).join(", ")}` : ""}</p>
          )}
          {r.status === "pending" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <input value={note[r.id] || ""} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} maxLength={300} placeholder="Note to the member (optional)" className="flex-1 min-w-[12rem] bg-black/40 border border-white/10 rounded-lg p-2 text-white" />
              <button disabled={busy === r.id} onClick={() => decide(r.id, true)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Approve</button>
              <button disabled={busy === r.id} onClick={() => decide(r.id, false)} className="border border-white/20 text-white px-4 py-2 rounded-lg">Decline</button>
            </div>
          ) : <p className="text-xs text-gray-500 mt-3">{r.status}{r.decisionNote ? `: ${r.decisionNote}` : ""}</p>}
        </section>
      ))}
    </div>
  )
}
