"use client"

import { GenderPick } from "@/components/profile/gender-pick"
import { PlacePicker } from "@/components/profile/place-picker"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Camera, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { INTERESTS } from "@/lib/interests"
import { getMyProfile, saveMyProfile, uploadProfilePhoto, photoUrl, type MyProfile } from "@/lib/api/profile"
import { kyc, type KycCase } from "@/lib/api/kyc"
import { resetSetup } from "@/lib/setup"

const KYC_TEXT: Record<string, { label: string; tone: string }> = {
  approved: { label: "Verified", tone: "text-emerald-400" },
  submitted: { label: "Under review", tone: "text-amber-300" },
  rejected: { label: "Rejected: resubmit", tone: "text-red-400" },
  expired: { label: "Expired: resubmit", tone: "text-red-400" },
}

export function ProfilePanel({ displayName, memberNumber }: { displayName: string; memberNumber: string }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [kycCase, setKycCase] = useState<KycCase | null | undefined>(undefined)
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [gender, setGender] = useState("")
  const [learn, setLearn] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMyProfile().then((p) => {
      let local: string[] = []
      try { local = JSON.parse(localStorage.getItem("hr_access_needs") || "[]") } catch { /* ignore */ }
      setProfile(p); setBio(p.bio); setCity(p.city); setGender(p.gender || ""); setLearn(p.learnGoal)
      // Choices made in the onboarding guide before signing in carry over once.
      setInterests(p.interests.length ? p.interests : local)
    }).catch(() => setProfile({ photoPath: null, bio: "", city: "", interests: [], learnGoal: "", gender: "" }))
    kyc.mine().then(setKycCase).catch(() => setKycCase(null))
  }, [])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })

  const save = async () => {
    setBusy(true)
    try { setProfile(await saveMyProfile({ gender, bio, city, interests, learnGoal: learn })); resetSetup(); toast({ title: "Profile saved" }) } catch (e) { fail("Couldn't save", e) } finally { setBusy(false) }
  }
  const pickPhoto = async (f: File | undefined) => {
    if (!f) return
    setPhotoBusy(true)
    try { const id = await uploadProfilePhoto(f); setProfile(await saveMyProfile({ photoAssetId: id })); resetSetup(); toast({ title: "Photo updated" }) } catch (e) { fail("Couldn't upload the photo", e) } finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = "" }
  }
  const toggle = (id: string) => setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  if (!profile) return <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex items-center gap-3 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading your profile…</NexusCard>

  const kycState = kycCase ? KYC_TEXT[kycCase.status] : null
  const checklist = [
    { done: !!profile.photoPath, label: "Add a profile photo" },
    { done: !!(profile.bio && profile.city), label: "Write a short bio and your city" },
    { done: profile.interests.length > 0, label: "Choose what you want here" },
    { done: kycCase?.status === "approved", label: "Verify your identity (KYC)", href: "/kyc" },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex flex-col items-center gap-3">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold text-gray-500">
            {profile.photoPath
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photoUrl(profile.photoPath) ?? ""} alt="Your profile photo" className="w-full h-full object-cover" />
              : (displayName || "?").charAt(0).toUpperCase()}
            {photoBusy && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest"><Camera className="w-3.5 h-3.5" /> {profile.photoPath ? "Change photo" : "Add photo"}</button>
          <p className="text-[10px] text-gray-600 text-center max-w-[10rem]">Only you and the Hell Road team can see your photo.</p>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-xs text-gray-500">{memberNumber}{user?.email ? ` · ${user.email}` : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10">
              <ShieldCheck className={`w-3.5 h-3.5 ${kycState?.tone ?? "text-gray-500"}`} />
              KYC: <span className={kycState?.tone ?? "text-gray-400"}>{kycCase === undefined ? "…" : kycState?.label ?? "Not started"}</span>
            </span>
            {kycCase?.status !== "approved" && kycCase !== undefined && <Link href="/kyc" className="text-cyan-400 font-bold uppercase tracking-widest">{kycCase ? "Open KYC" : "Start KYC"}</Link>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><PlacePicker value={city} onChange={setCity} /></div>
            <div className="sm:col-span-2"><GenderPick value={gender} onChange={setGender} /></div>
            <input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} placeholder="A short line about you" aria-label="Bio" className="h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white" />
          </div>
          <textarea value={learn} onChange={(e) => setLearn(e.target.value)} maxLength={500} rows={2} placeholder="What do you most want to learn or get from Hell Road?" aria-label="What you want to learn" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-sm text-white" />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">What you want here</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button key={i.id} onClick={() => toggle(i.id)} aria-pressed={interests.includes(i.id)}
              className={`px-3 py-1.5 rounded-full text-xs border ${interests.includes(i.id) ? "bg-red-600 border-red-600 text-white" : "border-white/15 text-gray-300 hover:border-white/30"}`}>{i.title}</button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Not sure where to start? <Link className="underline" href="/onboarding">Open the guide</Link> to see what each choice needs.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Your profile: {doneCount} of {checklist.length}</p>
          <ul className="space-y-1 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 ${c.done ? "text-gray-500" : "text-gray-200"}`}>
                {c.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-gray-600" />}
                {c.href && !c.done ? <Link className="underline" href={c.href}>{c.label}</Link> : c.label}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={save} disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg">{busy ? "Saving…" : "Save profile"}</button>
      </div>
    </NexusCard>
  )
}
