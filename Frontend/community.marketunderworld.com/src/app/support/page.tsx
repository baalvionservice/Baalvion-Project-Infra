"use client"

import { useCallback, useEffect, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { TicketThread } from "@/components/support/ticket-thread"
import { useAuth } from "@/context/auth-context"
import { support, ApiError, type Ticket, type TicketCategory, type TicketDetail } from "@/lib/api/staff"

const CATEGORIES: { id: TicketCategory; label: string }[] = [
  { id: "order", label: "An order" }, { id: "payment", label: "A payment" }, { id: "account", label: "My account" },
  { id: "booking", label: "A club booking" }, { id: "verification", label: "Verification / KYC" }, { id: "other", label: "Something else" },
]
const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  pending: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  resolved: "text-green-300 border-green-500/30 bg-green-500/10",
  closed: "text-gray-400 border-gray-500/30 bg-gray-500/10",
}
const STATUS_LABEL: Record<Ticket["status"], string> = { open: "Waiting for us", pending: "We replied", resolved: "Resolved", closed: "Closed" }
const field = "w-full bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-cyan-500/50 text-white"

export default function SupportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [open, setOpen] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ category: "order" as TicketCategory, subject: "", message: "" })
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    try {
      setError("")
      setTickets(await support.mine())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setNeedsLogin(true)
      else setError(err instanceof Error ? err.message : "Could not load your tickets")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { setNeedsLogin(true); setLoading(false); return }
    load()
  }, [authLoading, isAuthenticated, load])

  const create = async () => {
    setSending(true)
    setError("")
    try {
      const t = await support.create(form)
      setForm({ category: "order", subject: "", message: "" })
      await load()
      setOpen(await support.get(t.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your ticket")
    } finally {
      setSending(false)
    }
  }

  const show = async (id: string) => {
    try { setOpen(await support.get(id)) } catch (err) { setError(err instanceof Error ? err.message : "Could not open that ticket") }
  }
  const close = async () => {
    if (!open) return
    try { await support.close(open.id); setOpen(null); await load() } catch (err) { setError(err instanceof Error ? err.message : "Could not close the ticket") }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />
      <main className="container max-w-5xl mx-auto px-6 pt-40 pb-32 space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl font-black">Help &amp; support</h1>
          <p className="text-gray-400">Tell us what went wrong and a person will reply here. We also email you when we answer.</p>
        </header>

        {needsLogin && <SignInNotice next="/support" what="contact support" />}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {loading && !needsLogin && <p className="text-gray-500">Loading…</p>}

        {!needsLogin && !loading && (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">New ticket</h2>
              <select className={`${field} h-12`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <input className={`${field} h-12`} placeholder="Short summary" maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <textarea className={`${field} py-3`} rows={6} placeholder="What happened? Include order numbers or dates." maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button onClick={create} disabled={sending} className="w-full h-12 rounded-xl bg-cyan-500 text-black font-bold disabled:opacity-60">{sending ? "Sending…" : "Send to support"}</button>

              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 pt-4">Your tickets</h2>
              {tickets.length === 0 && <p className="text-gray-500 text-sm">None yet.</p>}
              {tickets.map((t) => (
                <button key={t.id} onClick={() => show(t.id)} className={`w-full text-left p-4 rounded-xl border bg-white/[0.03] hover:bg-white/[0.06] ${open?.id === t.id ? "border-cyan-500/50" : "border-white/10"}`}>
                  <div className="font-bold line-clamp-1">{t.subject}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                    <span className="text-xs text-gray-500">{new Date(t.lastMessageAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              {open ? (
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="text-xl font-bold">{open.subject}</h2><span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[open.status]}`}>{STATUS_LABEL[open.status]}</span></div>
                    {open.status !== "closed" && <button onClick={close} className="text-sm text-gray-400 hover:text-white underline">Close ticket</button>}
                  </div>
                  <TicketThread ticket={open} onSend={(body) => support.reply(open.id, body)} disabled={open.status === "closed"} />
                </div>
              ) : (
                <div className="h-full min-h-[240px] rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-gray-500 text-sm">Open a ticket to read the conversation.</div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
