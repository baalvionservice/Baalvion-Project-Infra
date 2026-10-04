"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { edu, isUnauthorized, type Teacher } from "@/lib/api/education"
import { cn } from "@/lib/utils"
import { ImageUpload } from "@/components/upload/image-upload"

const REGIONS = ["sas", "eap", "mea", "eur", "nam", "lat", "afr"]
const input = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-orange-500/50 text-white"
const label = "block text-xs font-bold text-gray-400 uppercase mb-2"

const STATUS_COPY: Record<Teacher["status"], { text: string; cls: string }> = {
  pending: { text: "Your application is waiting for admin review. You'll be listed once it's approved.", cls: "bg-amber-500/10 border-amber-500/20 text-amber-300" },
  active: { text: "You're approved and listed on the Education page.", cls: "bg-green-500/10 border-green-500/20 text-green-300" },
  rejected: { text: "Your application was not approved. Update it and save to resubmit.", cls: "bg-red-500/10 border-red-500/20 text-red-300" },
  suspended: { text: "Your teacher account is suspended.", cls: "bg-red-500/10 border-red-500/20 text-red-300" },
}

export default function TeacherProfilePage() {
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [form, setForm] = useState({
    displayName: "", subject: "", bio: "", longBio: "", regionId: "sas", country: "", priceNote: "", avatarUrl: "", tags: "",
  })

  const fill = (t: Teacher) =>
    setForm({
      displayName: t.name, subject: t.subject, bio: t.bio, longBio: t.longBio ?? "", regionId: t.regionId, country: t.country,
      priceNote: t.priceNote ?? "", avatarUrl: t.avatarUrl ?? "", tags: t.tags.join(", "),
    })

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }
    edu.myTeacher()
      .then((t) => { setTeacher(t); if (t) fill(t) })
      .catch((err) => (isUnauthorized(err) ? setNeedsLogin(true) : setMessage({ text: err instanceof Error ? err.message : "Could not load your profile", ok: false })))
      .finally(() => setLoading(false))
  }, [authLoading, isAuthenticated])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const saved = await edu.saveTeacher({
        displayName: form.displayName, subject: form.subject, bio: form.bio, longBio: form.longBio || undefined,
        regionId: form.regionId, country: form.country, priceNote: form.priceNote || undefined, avatarUrl: form.avatarUrl || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        skills: teacher?.skills ?? [], education: teacher?.education ?? [],
      })
      setTeacher(saved)
      setMessage({ text: "Saved.", ok: true })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Could not save", ok: false })
    } finally {
      setSaving(false)
    }
  }

  if (needsLogin) return <SignInNotice next="/teacher-dashboard" what="apply to teach" />

  return (
    <div className="max-w-3xl space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">{teacher ? "Your teacher profile" : "Apply to teach"}</h1>
        <p className="text-gray-400 mt-1">Applications are reviewed by our team. Pricing is agreed directly with students; nothing is charged by this site.</p>
      </div>
      {loading && <p className="text-gray-500">Loading…</p>}
      {teacher && <div className={cn("p-4 rounded-xl border text-sm font-medium", STATUS_COPY[teacher.status].cls)}>{STATUS_COPY[teacher.status].text}{teacher.reviewNote ? ` Note: ${teacher.reviewNote}` : ""}</div>}

      {!loading && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div><label className={label}>Display name</label><input className={input} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
            <div><label className={label}>Subject</label><input className={input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><label className={label}>Region</label>
              <select className={input} value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })}>{REGIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select></div>
            <div><label className={label}>Country</label><input className={input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div><label className={label}>Price note (optional)</label><input className={input} placeholder="e.g. ₹1,500 per hour" value={form.priceNote} onChange={(e) => setForm({ ...form, priceNote: e.target.value })} /></div>
            <ImageUpload label="Profile photo (optional)" purpose="teacher_avatar" value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} />
          </div>
          <div><label className={label}>Short bio (shown on cards)</label><textarea className={cn(input, "h-24 py-3")} maxLength={400} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div><label className={label}>Full bio (optional)</label><textarea className={cn(input, "h-40 py-3")} value={form.longBio} onChange={(e) => setForm({ ...form, longBio: e.target.value })} /></div>
          <div><label className={label}>Tags, comma separated</label><input className={input} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          {message && <p role="alert" className={cn("text-sm", message.ok ? "text-green-400" : "text-red-400")}>{message.text}</p>}
          <button onClick={save} disabled={saving || teacher?.status === "suspended"} className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold disabled:opacity-60">
            {saving ? "Saving…" : teacher ? "Save changes" : "Submit application"}
          </button>
        </div>
      )}
    </div>
  )
}
