"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Camera, Heart, Loader2, MessageCircle, ShieldCheck, X, Flag } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { PlacePicker } from "@/components/profile/place-picker"
import { uploadImage } from "@/lib/api/media"
import { dating, datingPhoto, DatingError, type DatingProfile, type MyDating } from "@/lib/api/dating"

const field = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-pink-500/60 text-white text-base"
const label = "block text-xs font-bold text-gray-400 uppercase mb-2"
const LOOKING: Record<string, string> = { dating: "Dating", relationship: "A relationship", friendship: "Friendship", networking: "Founder networking" }
const uuidIn = (url: string) => /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(url)?.[1] ?? null

function Photo({ path, name, className }: { path: string | null; name: string; className: string }) {
  const src = datingPhoto(path)
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={name} className={`${className} object-cover`} /> : <div className={`${className} bg-white/5 flex items-center justify-center text-4xl font-bold text-gray-600`}>{name.slice(0, 1)}</div>
}

function ProfileForm({ mine, onSaved }: { mine: MyDating; onSaved: (m: MyDating) => void }) {
  const p = mine.profile
  const [f, setF] = useState({ displayName: p?.name ?? "", headline: p?.headline ?? "", bio: p?.bio ?? "", city: p?.city ?? "", isFounder: p?.isFounder ?? false, companyName: p?.company ?? "", roleTitle: p?.role ?? "", lookingFor: p?.lookingFor ?? "dating" })
  const [photoUrl, setPhotoUrl] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState("")
  const file = useRef<HTMLInputElement>(null)

  const pickPhoto = async (fl: File | undefined) => {
    if (!fl) return
    setPhotoBusy(true); setError("")
    try { setPhotoUrl(await uploadImage(fl, "dating_photo")) } catch (e) { setError(e instanceof Error ? e.message : "Photo upload failed") } finally { setPhotoBusy(false); if (file.current) file.current.value = "" }
  }
  const save = async () => {
    setError("")
    if (f.displayName.trim().length < 2) return setError("Add the first name you want others to see.")
    if (f.bio.trim().length < 20) return setError("Write a few lines about yourself (at least 20 characters).")
    setBusy(true)
    try {
      const photoAssetId = photoUrl === undefined ? undefined : photoUrl ? uuidIn(photoUrl) : null
      onSaved(await dating.save({ displayName: f.displayName.trim(), headline: f.headline.trim() || undefined, bio: f.bio.trim(), city: f.city || undefined, isFounder: f.isFounder, companyName: f.companyName.trim() || undefined, roleTitle: f.roleTitle.trim() || undefined, lookingFor: f.lookingFor, photoAssetId, active: true }))
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save") } finally { setBusy(false) }
  }
  const shownPhoto = photoUrl === undefined ? datingPhoto(p?.photoPath ?? null) : photoUrl

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 sm:p-7 space-y-5">
      <div className="flex items-center gap-4">
        {shownPhoto ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={shownPhoto} alt="Your photo" className="w-24 h-24 rounded-2xl object-cover" /> : <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600"><Camera className="w-7 h-7" /></div>}
        <div>
          <button type="button" onClick={() => file.current?.click()} disabled={photoBusy} className="h-11 px-4 rounded-lg border border-white/15 text-sm font-semibold">{photoBusy ? "Uploading…" : shownPhoto ? "Change photo" : "Add a clear photo"}</button>
          <p className="text-xs text-gray-500 mt-1">Only signed-in members with a profile can see it.</p>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label}>Name others see</label><input className={field} value={f.displayName} maxLength={80} onChange={(e) => setF({ ...f, displayName: e.target.value })} placeholder="First name" /></div>
        <div><label className={label}>I am looking for</label>
          <select className={field} value={f.lookingFor} onChange={(e) => setF({ ...f, lookingFor: e.target.value })}>{Object.entries(LOOKING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </div>
      <div><label className={label}>Where you live</label><PlacePicker value={f.city} onChange={(v) => setF({ ...f, city: v })} /></div>
      <div><label className={label}>One line about you</label><input className={field} value={f.headline} maxLength={120} onChange={(e) => setF({ ...f, headline: e.target.value })} /></div>
      <div><label className={label}>About you</label><textarea className={`${field} h-28 py-3`} value={f.bio} maxLength={600} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
      <label className="flex items-start gap-3 text-sm text-gray-200"><input type="checkbox" className="mt-1 accent-pink-500" checked={f.isFounder} onChange={(e) => setF({ ...f, isFounder: e.target.checked })} /> <span>I am a founder. Show my company and role, and list me under Founders.</span></label>
      {f.isFounder && <div className="grid sm:grid-cols-2 gap-4"><div><label className={label}>Company</label><input className={field} value={f.companyName} maxLength={120} onChange={(e) => setF({ ...f, companyName: e.target.value })} /></div><div><label className={label}>Your role</label><input className={field} value={f.roleTitle} maxLength={80} onChange={(e) => setF({ ...f, roleTitle: e.target.value })} placeholder="Founder and CEO" /></div></div>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button onClick={save} disabled={busy} className="w-full h-14 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-60 font-bold text-lg">{busy ? "Saving…" : p ? "Save my profile" : "Create my profile"}</button>
    </div>
  )
}

function Card({ p, onAct, onReport }: { p: DatingProfile; onAct: (a: "like" | "pass") => void; onReport: () => void }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10 max-w-md mx-auto">
      <Photo path={p.photoPath} name={p.name} className="w-full aspect-[4/5]" />
      <div className="p-5 space-y-2">
        <div className="flex items-baseline justify-between gap-3"><h3 className="text-2xl font-bold">{p.name}, {p.age}</h3>{p.isFounder && <span className="text-xs font-bold text-pink-300 bg-pink-500/10 border border-pink-500/30 rounded-full px-3 py-1">Founder</span>}</div>
        {p.isFounder && (p.company || p.role) && <p className="text-sm text-gray-300">{[p.role, p.company].filter(Boolean).join(" at ")}</p>}
        <p className="text-sm text-gray-400">{p.city || "Location not shared"} · {LOOKING[p.lookingFor] ?? p.lookingFor}</p>
        {p.headline && <p className="font-medium">{p.headline}</p>}
        <p className="text-sm text-gray-300 whitespace-pre-line">{p.bio}</p>
        <div className="flex gap-3 pt-3">
          <button onClick={() => onAct("pass")} className="flex-1 h-14 rounded-xl border border-white/15 flex items-center justify-center gap-2 font-semibold hover:bg-white/5"><X className="w-5 h-5" /> Pass</button>
          <button onClick={() => onAct("like")} className="flex-1 h-14 rounded-xl bg-pink-600 hover:bg-pink-500 flex items-center justify-center gap-2 font-semibold"><Heart className="w-5 h-5" /> Like</button>
        </div>
        <button onClick={onReport} className="text-xs text-gray-500 underline flex items-center gap-1 mx-auto pt-1"><Flag className="w-3 h-3" /> Report this profile</button>
      </div>
    </div>
  )
}

export default function DatingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [tab, setTab] = useState<"discover" | "matches" | "profile">("discover")
  const [mine, setMine] = useState<MyDating | null>(null)
  const [queue, setQueue] = useState<DatingProfile[] | null>(null)
  const [matches, setMatches] = useState<(DatingProfile & { conversationId: string })[]>([])
  const [founders, setFounders] = useState(false)
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  const loadQueue = useCallback(() => { setQueue(null); dating.discover({ founders }).then(setQueue).catch((e) => { setQueue([]); if (e instanceof DatingError && e.code !== "PROFILE_REQUIRED") setError(e.message) }) }, [founders])
  useEffect(() => { if (isAuthenticated) dating.mine().then(setMine).catch((e) => setError(e instanceof Error ? e.message : "Could not load")) }, [isAuthenticated])
  useEffect(() => { if (mine?.profile?.active) loadQueue() }, [mine, loadQueue])
  useEffect(() => { if (tab === "matches" && mine?.profile) dating.matches().then(setMatches).catch(() => {}) }, [tab, mine])

  const act = async (p: DatingProfile, a: "like" | "pass") => {
    setNote("")
    try { const r = await dating.act(p.id, a); if (r.matched) setNote(`It's a match with ${p.name}. Open Matches to message them.`) } catch (e) { setError(e instanceof Error ? e.message : "Could not save") }
    setQueue((q) => (q ? q.filter((x) => x.id !== p.id) : q))
  }
  const report = async (p: DatingProfile) => {
    const reason = window.prompt("What is wrong with this profile? Tell us in a sentence or two.")
    if (!reason) return
    try { await dating.report(p.id, reason); setNote("Thanks. The team will look at it."); setQueue((q) => (q ? q.filter((x) => x.id !== p.id) : q)) } catch (e) { setError(e instanceof Error ? e.message : "Could not send the report") }
  }

  if (isLoading || (isAuthenticated && !mine && !error)) return <div className="min-h-screen bg-[#0a0a0a] pt-40 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Dating and founders</h1>
          <p className="text-gray-400 mt-2">Real members only. Everyone here is a verified adult (18+). You see people who joined, and you can only message someone when you both like each other. Nobody pays for a date.</p>
        </header>
        {!isAuthenticated ? <SignInNotice next="/dating" what="meet people" /> : (
          <>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            {mine && !mine.verified && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="w-5 h-5" /> Verify first</div>
                <p className="text-sm text-amber-100">Dating is for verified adults. Send your ID and selfie once, and you can create your profile as soon as it is approved.</p>
                <Link href="/kyc?next=/dating" className="inline-block h-11 leading-[2.75rem] px-6 rounded-lg bg-amber-500 text-black font-bold">Verify now</Link>
              </div>
            )}
            {mine?.verified && (
              <>
                <div className="grid grid-cols-3 gap-2" role="tablist">
                  {([["discover", "Discover"], ["matches", "Matches"], ["profile", mine.profile ? "My profile" : "Create profile"]] as const).map(([k, t]) => (
                    <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-11 rounded-lg text-sm font-semibold border ${tab === k ? "bg-white text-black border-white" : "border-white/15 text-gray-300"}`}>{t}</button>
                  ))}
                </div>
                {note && <div className="p-4 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-100 text-sm">{note}</div>}
                {mine.profile?.hidden && <p className="text-sm text-red-300">Your profile was hidden by the team. Contact support.</p>}
                {tab === "profile" && <ProfileForm mine={mine} onSaved={(m) => { setMine(m); setTab("discover") }} />}
                {tab === "discover" && (!mine.profile ? <p className="text-gray-400">Create your profile first. It takes a minute, and then you can see others.</p> : (
                  <>
                    <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" className="accent-pink-500" checked={founders} onChange={(e) => setFounders(e.target.checked)} /> Show founders only</label>
                    {queue === null ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : queue.length === 0 ? <p className="text-gray-400 py-10 text-center">No new profiles right now. Check back soon, new members join every day.</p> : <Card key={queue[0].id} p={queue[0]} onAct={(a) => act(queue[0], a)} onReport={() => report(queue[0])} />}
                  </>
                ))}
                {tab === "matches" && (matches.length === 0 ? <p className="text-gray-400 py-10 text-center">No matches yet. When you and someone else like each other, they show up here.</p> : (
                  <ul className="space-y-3">{matches.map((m) => (
                    <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-white/10 p-3">
                      <Photo path={m.photoPath} name={m.name} className="w-16 h-16 rounded-xl" />
                      <div className="flex-1 min-w-0"><div className="font-semibold">{m.name}, {m.age}</div><div className="text-sm text-gray-400 truncate">{m.isFounder && m.company ? `${m.role || "Founder"} at ${m.company}` : m.city}</div></div>
                      <Link href="/messages" className="h-11 px-4 rounded-lg bg-pink-600 flex items-center gap-2 text-sm font-semibold"><MessageCircle className="w-4 h-4" /> Message</Link>
                    </li>
                  ))}</ul>
                ))}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
