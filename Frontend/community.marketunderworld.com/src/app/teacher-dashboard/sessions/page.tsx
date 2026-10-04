"use client"

import { useAuth } from "@/context/auth-context"
import { useCallback, useEffect, useState } from "react"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { edu, isUnauthorized, formatWhen, type Enrollment, type Session } from "@/lib/api/education"
import { cn } from "@/lib/utils"

const input = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-orange-500/50 text-white"
const label = "block text-xs font-bold text-gray-400 uppercase mb-2"

export default function TeacherSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", startAt: "", durationMin: "60", capacity: "20", meetingUrl: "" })

  const load = useCallback(async () => {
    try {
      setError("")
      setSessions(await edu.mySessions())
    } catch (err) {
      if (isUnauthorized(err)) setNeedsLogin(true)
      else setError(err instanceof Error ? err.message : "Could not load sessions")
    }
  }, [])

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { setNeedsLogin(true); return }
    load()
  }, [authLoading, isAuthenticated, load])

  const create = async () => {
    setSaving(true)
    setError("")
    try {
      await edu.createSession({
        title: form.title, description: form.description || undefined,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : "",
        durationMin: Number(form.durationMin), capacity: Number(form.capacity), meetingUrl: form.meetingUrl,
      })
      setForm({ title: "", description: "", startAt: "", durationMin: "60", capacity: "20", meetingUrl: "" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the session")
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string) => {
    if (open === id) return setOpen(null)
    setOpen(id)
    try { setEnrollments(await edu.sessionEnrollments(id)) } catch (err) { setError(err instanceof Error ? err.message : "Could not load requests") }
  }

  const decide = async (id: string, status: "approved" | "declined") => {
    try {
      await edu.decide(id, status)
      if (open) setEnrollments(await edu.sessionEnrollments(open))
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update the request") }
  }

  const cancelSession = async (id: string) => {
    if (!confirm("Cancel this session? Students will see it as cancelled.")) return
    try { await edu.updateSession(id, { status: "cancelled" }); await load() } catch (err) { setError(err instanceof Error ? err.message : "Could not cancel") }
  }

  if (needsLogin) return <SignInNotice next="/teacher-dashboard/sessions" what="manage sessions" />

  return (
    <div className="max-w-4xl space-y-10 text-white">
      <div>
        <h1 className="text-3xl font-bold">Sessions & requests</h1>
        <p className="text-gray-400 mt-1">Host on your own video link. Students only see the link after you approve them.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
        <h2 className="font-bold">Schedule a session</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={label}>Title</label><input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className={label}>Starts</label><input type="datetime-local" className={input} value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div>
          <div><label className={label}>Meeting link (https)</label><input type="url" className={input} placeholder="https://meet..." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} /></div>
          <div><label className={label}>Duration (minutes)</label><input type="number" className={input} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} /></div>
          <div><label className={label}>Capacity</label><input type="number" className={input} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={label}>Description (optional)</label><textarea className={cn(input, "h-24 py-3")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <button onClick={create} disabled={saving} className="h-12 px-8 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold disabled:opacity-60">{saving ? "Saving…" : "Schedule"}</button>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 && <p className="text-gray-500">No sessions yet.</p>}
        {sessions.map((s) => (
          <div key={s.id} className={cn("rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden", s.status === "cancelled" && "opacity-50")}>
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-bold">{s.title} {s.status === "cancelled" && <span className="text-xs text-red-400 ml-2">CANCELLED</span>}</div>
                <div className="text-xs text-gray-500">{formatWhen(s.startAt)} · {s.durationMin} min · {s.approved ?? 0}/{s.capacity} approved · {s.requested ?? 0} waiting</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(s.id)} className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold">{open === s.id ? "Hide" : "Requests"}</button>
                {s.status === "scheduled" && <button onClick={() => cancelSession(s.id)} className="h-10 px-4 rounded-lg bg-white/5 text-red-300 text-sm font-bold">Cancel</button>}
              </div>
            </div>
            {open === s.id && (
              <div className="border-t border-white/5 p-5 space-y-2">
                {enrollments.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
                {enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <div className="text-sm"><span className="font-bold">{e.student ?? "Student"}</span>{e.note && <span className="text-gray-500"> — “{e.note}”</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-gray-400">{e.status}</span>
                      {e.status !== "cancelled" && e.status !== "approved" && <button onClick={() => decide(e.id, "approved")} className="h-8 px-3 rounded-lg bg-green-500/20 text-green-300 text-xs font-bold">Approve</button>}
                      {e.status !== "cancelled" && e.status !== "declined" && <button onClick={() => decide(e.id, "declined")} className="h-8 px-3 rounded-lg bg-white/5 text-xs font-bold">Decline</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
