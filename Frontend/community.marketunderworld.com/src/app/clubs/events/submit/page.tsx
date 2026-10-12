"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { ImageUpload } from "@/components/upload/image-upload"
import { useAuth } from "@/context/auth-context"
import { myEvents, searchClubs, type ApiClub, type ApiEvent } from "@/lib/api/nightlife"

const field = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/60 text-white text-base"
const label = "block text-xs font-bold text-gray-400 uppercase mb-2"
const STATUS: Record<string, string> = { pending_review: "Waiting for the events team", active: "Live on the events page", rejected: "Not approved", cancelled: "Cancelled" }

export default function SubmitEventPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [q, setQ] = useState("")
  const [results, setResults] = useState<ApiClub[]>([])
  const [club, setClub] = useState<ApiClub | null>(null)
  const [f, setF] = useState({ eventName: "", eventDate: "", djName: "", description: "", ticketUrl: "", ticketPriceText: "", image: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [mine, setMine] = useState<ApiEvent[]>([])

  const loadMine = () => myEvents.mine().then((r) => setMine(r.items)).catch(() => {})
  useEffect(() => { if (isAuthenticated) loadMine() }, [isAuthenticated])
  useEffect(() => {
    if (club || q.trim().length < 2) { setResults([]); return }
    const t = setTimeout(() => searchClubs(q.trim()).then(setResults).catch(() => setResults([])), 300)
    return () => clearTimeout(t)
  }, [q, club])

  const submit = async () => {
    setError("")
    if (!club) return setError("Choose the club or venue the event is at.")
    if (f.eventName.trim().length < 3) return setError("Give the event a name.")
    if (!f.eventDate) return setError("Pick the date.")
    if (f.description.trim().length < 10) return setError("Describe the event in a sentence or two.")
    setBusy(true)
    try {
      await myEvents.submit({
        clubId: club.id, eventName: f.eventName.trim(), eventDate: f.eventDate, description: f.description.trim(),
        djName: f.djName.trim() || undefined, image: f.image || undefined,
        ticketUrl: f.ticketUrl.trim() || undefined, ticketPriceText: f.ticketPriceText.trim() || undefined,
      })
      setSent(true); setF({ eventName: "", eventDate: "", djName: "", description: "", ticketUrl: "", ticketPriceText: "", image: "" }); setClub(null); setQ(""); loadMine()
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send your event") } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Post your event</h1>
          <p className="text-gray-400 mt-2">Add your poster, date and ticket details. The events team checks every event, then it goes live on the events page. Tickets are sold by you through your own link, we show the details.</p>
        </header>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : !isAuthenticated ? <SignInNotice next="/clubs/events/submit" what="post an event" /> : (
          <>
            {sent && <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" /> Sent. The events team will review it and it appears below with its status.</div>}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 sm:p-7 space-y-5">
              <div>
                <span className={label}>1. Venue</span>
                {club ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"><span>{club.name}, {club.city}</span><button className="text-sm underline" onClick={() => setClub(null)}>Change</button></div>
                ) : (
                  <>
                    <input className={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the venue by name or city" aria-label="Venue" />
                    {results.length > 0 && <ul className="mt-2 rounded-xl border border-white/10 divide-y divide-white/5 max-h-60 overflow-auto">{results.map((c) => <li key={c.id}><button className="w-full text-left px-4 py-3 hover:bg-white/5" onClick={() => setClub(c)}>{c.name} <span className="text-gray-500">· {c.suburb ? `${c.suburb}, ` : ""}{c.city}</span></button></li>)}</ul>}
                    <p className="text-xs text-gray-500 mt-2">Venue not listed? Ask the clubs team to add it from your dashboard first.</p>
                  </>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>2. Event name</label><input className={field} value={f.eventName} maxLength={200} onChange={(e) => setF({ ...f, eventName: e.target.value })} /></div>
                <div><label className={label}>Date</label><input type="date" className={field} value={f.eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, eventDate: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>DJ or artist (optional)</label><input className={field} value={f.djName} maxLength={160} onChange={(e) => setF({ ...f, djName: e.target.value })} /></div>
              </div>
              <div><label className={label}>3. About the event</label><textarea className={`${field} h-28 py-3`} value={f.description} maxLength={2000} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Music, dress code, what guests can expect" /></div>
              <ImageUpload label="4. Event poster (optional)" purpose="event_poster" value={f.image} onChange={(url) => setF({ ...f, image: url })} />
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>5. Ticket link (optional)</label><input className={field} value={f.ticketUrl} placeholder="https://" onChange={(e) => setF({ ...f, ticketUrl: e.target.value })} /></div>
                <div><label className={label}>Ticket price (optional)</label><input className={field} value={f.ticketPriceText} maxLength={60} placeholder="e.g. ₹1,500 per person" onChange={(e) => setF({ ...f, ticketPriceText: e.target.value })} /></div>
              </div>
              {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
              <button onClick={submit} disabled={busy} className="w-full h-14 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 font-bold text-lg">{busy ? "Sending…" : "Send for review"}</button>
            </div>
            {mine.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">Your events</h2>
                <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                  {mine.map((e) => <li key={e.id} className="p-4 flex flex-wrap items-center justify-between gap-2"><span>{e.eventName} <span className="text-gray-500">· {e.date} · {e.club?.name}</span></span><span className={`text-xs font-semibold ${e.status === "active" ? "text-emerald-400" : e.status === "rejected" ? "text-red-400" : "text-amber-300"}`}>{STATUS[e.status] ?? e.status}</span></li>)}
                </ul>
              </section>
            )}
            <p className="text-sm text-gray-500"><Link className="underline" href="/clubs/events">Back to events</Link></p>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
