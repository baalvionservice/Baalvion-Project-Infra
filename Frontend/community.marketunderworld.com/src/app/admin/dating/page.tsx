"use client"

import { useCallback, useEffect, useState } from "react"
import { datingAdmin, type AdminDating } from "@/lib/api/dating"

export default function AdminDatingPage() {
  const [items, setItems] = useState<AdminDating[] | null>(null)
  const [error, setError] = useState("")
  const load = useCallback(() => { datingAdmin.list().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Could not load")) }, [])
  useEffect(load, [load])
  const toggle = async (p: AdminDating) => {
    const hide = p.status !== "hidden_by_admin"
    const reason = hide ? window.prompt("Why is this profile being hidden? (the member is not shown this)") ?? undefined : undefined
    if (hide && reason === undefined) return
    try { await datingAdmin.hide(p.id, hide, reason); load() } catch (e) { setError(e instanceof Error ? e.message : "Could not update") }
  }
  return (
    <div className="p-8 space-y-6">
      <div><h1 className="text-3xl font-bold">Dating profiles</h1><p className="text-gray-500 mt-2">Every profile belongs to a KYC-verified adult. Reports from members arrive as support tickets titled "Dating profile report". Hide a profile to remove it from discovery and matches.</p></div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {items === null ? <p className="p-8 text-center text-gray-400 text-sm">Loading…</p> : items.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">No dating profiles yet.</p> : items.map((p) => (
          <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-medium">{p.name}, {p.age} {p.isFounder && <span className="ml-2 text-xs font-semibold text-pink-600">Founder{p.company ? `, ${p.company}` : ""}</span>}</div>
              <div className="text-sm text-gray-500">{p.city || "No city"} · member {p.userId} · {p.status}{p.hiddenReason ? ` (${p.hiddenReason})` : ""}</div>
              {p.bio && <div className="text-sm text-gray-600 mt-1 max-w-2xl">{p.bio}</div>}
            </div>
            <button onClick={() => toggle(p)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 self-start">{p.status === "hidden_by_admin" ? "Show again" : "Hide"}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
