"use client"

import { useCallback, useEffect, useState } from "react"
import { NexusCard } from "@/components/ui/nexus-card"
import { useToast } from "@/hooks/use-toast"
import { DEPARTMENTS, myRequests, sendRequest, withdrawRequest, type AccessRequest } from "@/lib/api/profile"

const STATUS_TEXT: Record<string, string> = { pending: "Waiting for a decision", approved: "Approved", declined: "Declined", withdrawn: "Withdrawn" }
const label = (key: string) => DEPARTMENTS.find((d) => d.key === key)?.label ?? key

export function AccessRequestsPanel() {
  const { toast } = useToast()
  const [items, setItems] = useState<AccessRequest[]>([])
  const [dept, setDept] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => { myRequests().then(setItems).catch(() => setItems([])) }, [])
  useEffect(load, [load])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })
  const send = async () => {
    if (!dept) return
    setBusy(true)
    try { await sendRequest(dept, message); setDept(null); setMessage(""); load(); toast({ title: "Request sent", description: "An admin will review it. You will get a notification with the decision." }) } catch (e) { fail("Couldn't send", e) } finally { setBusy(false) }
  }
  const withdraw = async (id: string) => { try { await withdrawRequest(id); load() } catch (e) { fail("Couldn't withdraw", e) } }
  const pendingDepts = new Set(items.filter((i) => i.status === "pending").map((i) => i.department))

  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-5">
      <div>
        <h2 className="font-bold text-white">Ask to join a department</h2>
        <p className="text-sm text-gray-500 mt-1">Want to help run part of Hell Road? Pick a department and tell us why. An admin reads every request and answers it here.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {DEPARTMENTS.map((d) => (
          <button key={d.key} disabled={pendingDepts.has(d.key)} onClick={() => setDept(dept === d.key ? null : d.key)}
            className={`text-left rounded-xl border p-3 disabled:opacity-50 ${dept === d.key ? "border-red-500 bg-red-950/30" : "border-white/10 hover:border-white/25"}`}>
            <div className="font-semibold text-sm text-white">{d.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{pendingDepts.has(d.key) ? "Request already sent" : d.what}</div>
          </button>
        ))}
      </div>
      {dept && (
        <div className="space-y-3">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={600} aria-label="Why do you want to join" placeholder={`Why do you want to join ${label(dept)}? What can you do for them?`} className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-sm text-white" />
          <button onClick={send} disabled={busy || message.trim().length < 10} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">{busy ? "Sending…" : `Send request to ${label(dept)}`}</button>
        </div>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-white/5 text-sm">
          {items.map((i) => (
            <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-white font-semibold">{label(i.department)}</span>
                <span className={`ml-2 text-xs ${i.status === "approved" ? "text-emerald-400" : i.status === "declined" ? "text-red-400" : "text-gray-400"}`}>{STATUS_TEXT[i.status]}</span>
                {i.decisionNote && <p className="text-xs text-gray-500 mt-0.5">{i.decisionNote}</p>}
              </div>
              {i.status === "pending" && <button onClick={() => withdraw(i.id)} className="text-xs text-gray-400 underline">Withdraw</button>}
            </li>
          ))}
        </ul>
      )}
    </NexusCard>
  )
}
