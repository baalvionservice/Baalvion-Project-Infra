"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ApiError, elite, type EliteJoin, type HostParty } from "@/lib/api/nightlife"

const input = "w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"

// Asking to come to a party: how many men and women you are bringing (yourself included).
export function JoinDialog({ party, onClose, onDone }: { party: { id: string; hostAlias: string; clubName: string; slotsLeft: number | null; ladiesFree?: boolean }; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [males, setMales] = useState(0)
  const [females, setFemales] = useState(1)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [kycNeeded, setKycNeeded] = useState(false)
  const [signIn, setSignIn] = useState(false)
  const [tierMsg, setTierMsg] = useState("")
  const total = males + females

  const send = async () => {
    setBusy(true); setKycNeeded(false); setSignIn(false); setTierMsg("")
    try {
      await elite.join(party.id, { males, females, note: note || undefined })
      toast({ title: "Request sent", description: "The host or an admin will review it. You can follow it under My requests." })
      onDone(); onClose()
    } catch (e) {
      if (e instanceof ApiError && e.code === "KYC_REQUIRED") setKycNeeded(true)
      else if (e instanceof ApiError && e.code === "TIER_REQUIRED") setTierMsg(e.message)
      else if (e instanceof ApiError && e.status === 401) setSignIn(true)
      else toast({ variant: "destructive", title: "Couldn't send", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Ask to join this party">
      <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
        <h2 className="text-xl font-bold">Ask to join {party.hostAlias}&apos;s party</h2>
        <p className="text-sm text-gray-400">{party.clubName}{party.slotsLeft !== null ? ` · ${party.slotsLeft} place${party.slotsLeft === 1 ? "" : "s"} left` : ""}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">Women coming
            <input type="number" min={0} max={10} value={females} onChange={(e) => setFemales(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className={`${input} mt-1`} />
          </label>
          <label className="text-sm text-gray-300">Men coming
            <input type="number" min={0} max={10} value={males} onChange={(e) => setMales(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} className={`${input} mt-1`} />
          </label>
        </div>
        <p className="text-xs text-gray-400">{party.ladiesFree ? "This host offers free invitations to women guests (women only, set Woman in your profile). Everyone else joins as a paying member." : "Elite parties are for paying members."}</p>
        <p className="text-xs text-gray-500">Count yourself too. Total: {total}. Only verified (KYC) members can ask to join.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="A short note for the host (optional)" className={input} />
        {kycNeeded && <p className="text-sm text-amber-300">You need to verify your identity first. <Link className="underline" href="/kyc">Open KYC</Link></p>}
        {tierMsg && <p className="text-sm text-amber-300">{tierMsg} <Link className="underline" href="/access">See membership tiers</Link> or <Link className="underline" href="/dashboard#profile">update your profile</Link>.</p>}
        {signIn && <p className="text-sm text-amber-300">Please <Link className="underline" href="/auth/signin?redirect=/clubs/elite-host">sign in</Link> first.</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button onClick={send} disabled={busy || total < 1} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold px-5 py-2.5 rounded-lg disabled:opacity-50">{busy ? "Sending…" : "Send request"}</button>
        </div>
      </div>
    </div>
  )
}

export function MyJoins({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<EliteJoin[]>([])
  const load = useCallback(() => { elite.myJoins().then((r) => setItems(r.items)).catch(() => setItems([])) }, [])
  useEffect(load, [load, refreshKey])
  if (items.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-3">My requests</h2>
      <ul className="divide-y divide-white/10 text-sm">
        {items.map((j) => (
          <li key={j.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <span>{j.females} women, {j.males} men · <span className={j.status === "approved" ? "text-emerald-400" : j.status === "declined" ? "text-red-400" : "text-gray-400"}>{j.status === "pending" ? "waiting for the host" : j.status}</span></span>
            {(j.status === "pending" || j.status === "approved") && <button onClick={() => elite.withdraw(j.id).then(load)} className="text-xs text-gray-400 underline">Withdraw</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}

// The host's own parties and the people asking to come.
export function HostRequests() {
  const { toast } = useToast()
  const [parties, setParties] = useState<HostParty[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [guests, setGuests] = useState<Awaited<ReturnType<typeof elite.guests>> | null>(null)
  useEffect(() => { elite.myParties().then((r) => setParties(r.items)).catch(() => setParties([])) }, [])

  const show = async (id: string) => {
    if (open === id) { setOpen(null); return }
    setOpen(id); setGuests(null)
    try { setGuests(await elite.guests(id)) } catch { setGuests({ capacity: null, approvedGuests: 0, items: [] }) }
  }
  const decide = async (gid: string, approve: boolean) => {
    try { await elite.decide(gid, approve); if (open) setGuests(await elite.guests(open)) } catch (e) { toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again." }) }
  }

  if (parties.length === 0) return null
  return (
    <section className="mt-10 bg-white/5 border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-4">Your parties</h2>
      <ul className="space-y-3">
        {parties.map((p) => (
          <li key={p.id} className="border border-white/10 rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <div><span className="font-semibold">{p.clubName || "Venue"}</span>, {p.city} · {p.date ?? "date to be announced"} · <span className="text-gray-400">{p.status}</span></div>
              <button onClick={() => show(p.id)} className="underline text-amber-400">{p.pendingRequests} waiting · {p.approvedGuests}{p.guests ? ` of ${p.guests}` : ""} confirmed</button>
            </div>
            {open === p.id && (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {guests === null ? <li className="py-2 text-gray-500">Loading…</li> : guests.items.length === 0 ? <li className="py-2 text-gray-500">No requests yet.</li> : guests.items.map((g) => (
                  <li key={g.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <span>{g.requesterLabel || "Member"}: {g.females} women, {g.males} men{g.note ? ` · ${g.note}` : ""} · <span className="text-gray-400">{g.status}</span></span>
                    {g.status === "pending" && (
                      <span className="flex gap-2">
                        <button onClick={() => decide(g.id, true)} className="bg-amber-500 text-black font-bold px-3 py-1 rounded">Approve</button>
                        <button onClick={() => decide(g.id, false)} className="border border-white/20 px-3 py-1 rounded">Decline</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
