"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Check, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { INTERESTS, GROUPS } from "@/lib/interests"
import { DESTINATIONS, resetSetup } from "@/lib/setup"
import { getMyMember, setMyDisplayName, type MyMember } from "@/lib/api/members"
import { getMyProfile, saveMyProfile, uploadProfilePhoto, photoUrl, type MyProfile } from "@/lib/api/profile"
import { kyc, type KycCase } from "@/lib/api/kyc"
import { GenderPick } from "@/components/profile/gender-pick"
import { COUNTRIES, PLACES, OTHER_CITY, formatPlace, parsePlace, type Place } from "@/lib/locations"

// What each choice means for a new member: what it gives you and what it takes.
const NEEDS: Record<string, { value?: string; what: string; needed: string; cta: string; href: string }> = {
  clubs: { value: "Find the best venues in your city, get on guest lists and book VIP tables without calling around.", what: "Browse clubs, ask for the guest list or a VIP table, see DJ nights.", needed: "Just an account.", cta: "Open clubs", href: "/clubs" },
  forum: { value: "Ask questions, get answers from members, and meet people who care about the same things. You choose the communities.", what: "Read and post in the forum communities.", needed: "Just an account. Some communities approve requests.", cta: "Join the forum", href: "/forum/join" },
  locals: { value: "Casting calls and local gigs in one place, so you apply without searching group chats.", what: "Find casting calls and local gigs, or post as an employer.", needed: "An account. Employers and candidates are reviewed.", cta: "Open locals", href: "/locals" },
  buy: { value: "Buy from sellers the team has reviewed, and pay with your wallet points.", what: "Buy from sellers and pay with your wallet points.", needed: "A buyer pass, then load your wallet (100 points = $1).", cta: "Get the buyer pass", href: "/buyer-pass" },
  sell: { value: "A store on the marketplace with buyers already here and payments handled for you.", what: "Open a seller account and list products.", needed: "A seller application, reviewed by an admin, and a category payment.", cta: "Apply to sell", href: "/seller/onboarding" },
  wallet: { value: "A real chance to win a ticket for $6 (600 points) and a say in which DJs come to your city.", what: "Enter the monthly ticket draw and pledge toward the DJs you want.", needed: "Wallet points. Load them with crypto and an admin confirms.", cta: "Load your wallet", href: "/wallet" },
  trade: { value: "A listed intermediary guides your crypto trade so you are not alone.", what: "Pick a listed intermediary and trade with them directly.", needed: "An account. You pay the intermediary by scanning their QR.", cta: "See intermediaries", href: "/escrow/intermediaries" },
  agent: { value: "Earn your own fee by helping members trade.", what: "Help members buy USDT and trade, and earn your own fee.", needed: "A refundable $1,000 deposit, confirmed by an admin, and your payment QR.", cta: "Apply as an intermediary", href: "/escrow/apply-agent" },
  employer: { value: "Reach people looking for local work and manage who applies.", what: "Register your business or venue, then post local jobs and gigs and see who applies.", needed: "An account and a short business form. The team reviews it.", cta: "Register my business", href: "/nightlife/employer" },
  dating: { value: "Meet verified adults, including founders. Nobody pays for a date and you only message when you both like each other.", what: "Create a dating profile with a photo and a few lines, then like or pass on other members.", needed: "A verified identity (KYC), because dating is for adults 18 and over.", cta: "Open dating", href: "/dating" },
  elite_paid: { value: "Priority entry to Elite (Millionaire) parties and VIP clubs, and your seat is not left to chance.", what: "Pay the platform for a membership tier and spend your time at Elite parties, VIP tables and invite-only nights.", needed: "A membership tier ($100, $250 or $1,000). Pay, send a screenshot, and an admin confirms within 5 to 30 minutes.", cta: "Choose my membership", href: "/access" },
  elite_invite: { value: "A free place at a host's party, with no platform fee.", what: "Women guests can ask Elite (Millionaire) party hosts for a free invitation. You pick a party and send a short request.", needed: "An account. The host reads every request and decides, so an invitation is never promised.", cta: "Find a party", href: "/clubs/elite-host" },
  ticketseller: { value: "Your club in front of members who book guest lists and tables. Posted by you, checked by the events team.", what: "Post your ticketed night with the ticket link and price. The events team checks it and it goes live on the events page.", needed: "An account. Your venue must be in the directory; if it is not, ask the clubs team to add it.", cta: "Post a ticketed event", href: "/clubs/events/submit" },
  organiser: { value: "Your event in front of Hell Road members. Posted by you, checked by the events team.", what: "Post your event with its poster, date and ticket details. The events team checks it and it goes live on the events page.", needed: "An account. Fill in one short form; most events are reviewed within a day.", cta: "Post an event", href: "/clubs/events/submit" },
  student: { value: "Courses and live sessions, with your progress kept in your own classroom.", what: "Courses, live sessions and your own classroom.", needed: "An account.", cta: "Open student dashboard", href: "/student-dashboard" },
  teacher: { value: "A ready audience of students and tools to run live sessions.", what: "Run courses and live sessions for students.", needed: "An account. An admin approves teachers.", cta: "Open teacher dashboard", href: "/teacher-dashboard" },
  learn: { what: "Courses and live sessions.", needed: "An account. Teachers are approved by an admin.", cta: "Open education", href: "/education" },
}
const field = "w-full h-11 px-3 rounded-lg bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
const STEPS = ["About you", "What you want", "Your next steps"]

function Wizard() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [member, setMember] = useState<MyMember | null>(null)
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [kycCase, setKycCase] = useState<KycCase | null | undefined>(undefined)
  const [name, setName] = useState("")
  const [place, setPlace] = useState<Place>({ country: "", state: "", city: "" })
  const [otherCity, setOtherCity] = useState("")
  const [gender, setGender] = useState("")
  const [bio, setBio] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  const [learn, setLearn] = useState("")
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getMyMember().catch(() => null), getMyProfile().catch(() => null), kyc.mine().catch(() => null)]).then(([m, p, k]) => {
      setMember(m); setProfile(p); setKycCase(k)
      if (m?.customName) setName(m.displayName)
      if (p) { setGender(p.gender || ""); const pp = parsePlace(p.city); if (pp.country && pp.state && !PLACES[pp.country][pp.state].includes(pp.city)) { setOtherCity(pp.city); pp.city = OTHER_CITY } setPlace(pp); setBio(p.bio); setPicked(p.interests); setLearn(p.learnGoal) }
    })
  }, [])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })

  const saveAbout = async () => {
    if (!place.country || !place.state || !place.city || (place.city === OTHER_CITY && otherCity.trim().length < 2)) { toast({ variant: "destructive", title: "Pick where you are", description: "Choose your country, then your state, then your city." }); return }
    if (name.trim().length < 2) { toast({ variant: "destructive", title: "Pick a name", description: "Choose the name other members will see (at least 2 letters)." }); return }
    setBusy(true)
    try {
      setMember(await setMyDisplayName(name.trim()))
      setProfile(await saveMyProfile({ gender, city: formatPlace({ ...place, city: place.city === OTHER_CITY ? otherCity.trim() : place.city }), bio: bio.trim() }))
      resetSetup(); setStep(1)
    } catch (e) { fail("Couldn't save", e) } finally { setBusy(false) }
  }
  const saveInterests = async () => {
    if (picked.length === 0) { toast({ variant: "destructive", title: "Choose at least one", description: "Pick what you want here so we can take you to the right place." }); return }
    setBusy(true)
    try { setProfile(await saveMyProfile({ interests: picked, learnGoal: learn.trim() })); resetSetup(); setStep(2) } catch (e) { fail("Couldn't save", e) } finally { setBusy(false) }
  }
  const pickPhoto = async (f: File | undefined) => {
    if (!f) return
    setPhotoBusy(true)
    try { const id = await uploadProfilePhoto(f); setProfile(await saveMyProfile({ photoAssetId: id })); resetSetup() } catch (e) { fail("Couldn't upload the photo", e) } finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = "" }
  }
  const toggle = (id: string) => setPicked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const finish = () => {
    const first = picked.find((i) => DESTINATIONS[i])
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : first ? DESTINATIONS[first].href : "/dashboard")
  }

  if (!member || !profile) return <div className="pt-40 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
  const photo = photoUrl(profile.photoPath)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-20">
      <h1 className="text-3xl font-bold">Create your profile</h1>
      <p className="text-gray-400 mt-2">Three short steps. You can change everything later from your dashboard.</p>
      <ol className="mt-6 grid grid-cols-3 gap-2 text-center text-xs" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s} className={`rounded-lg border px-2 py-2.5 ${i < step ? "border-emerald-700 text-emerald-300" : i === step ? "border-red-500 text-white font-bold" : "border-white/10 text-gray-500"}`}>{i + 1}. {s}</li>)}
      </ol>

      {step === 0 && (
        <section className="mt-8 space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold text-gray-500 shrink-0">
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photo} alt="Your profile photo" className="w-full h-full object-cover" />
                : (name || "?").charAt(0).toUpperCase()}
              {photoBusy && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400"><Camera className="w-4 h-4" /> {photo ? "Change photo" : "Add a photo"}</button>
              <p className="text-xs text-gray-500 mt-1">Optional. Only you and the Hell Road team can see it.</p>
            </div>
          </div>
          <label className="block text-sm text-gray-300">Your name (what other members see)
            <input className={`${field} mt-1`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul K." />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 grid sm:grid-cols-3 gap-3">
              <label className="block text-sm text-gray-300">1. Country
                <select className={`${field} mt-1`} value={place.country} onChange={(e) => setPlace({ country: e.target.value as Place["country"], state: "", city: "" })}>
                  <option value="">Choose your country</option>
                  {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <label className="block text-sm text-gray-300">2. {COUNTRIES.find((c) => c.name === place.country)?.stateLabel ?? "State or emirate"}
                <select className={`${field} mt-1`} value={place.state} disabled={!place.country} onChange={(e) => setPlace({ ...place, state: e.target.value, city: "" })}>
                  <option value="">{place.country ? "Choose one" : "Pick a country first"}</option>
                  {place.country && Object.keys(PLACES[place.country]).map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
              <label className="block text-sm text-gray-300">3. City or area
                <select className={`${field} mt-1`} value={place.city} disabled={!place.state} onChange={(e) => setPlace({ ...place, city: e.target.value })}>
                  <option value="">{place.state ? "Choose one" : "Pick a state first"}</option>
                  {place.country && place.state && [...PLACES[place.country][place.state], OTHER_CITY].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {place.city === OTHER_CITY && <label className="block text-sm text-gray-300 sm:col-span-3">Type your city<input className={`${field} mt-1`} value={otherCity} maxLength={50} onChange={(e) => setOtherCity(e.target.value)} placeholder="Your city or town" /></label>}
              <div className="sm:col-span-3"><GenderPick value={gender} onChange={setGender} /></div>
            </div>
            <label className="block text-sm text-gray-300">A line about you<input className={`${field} mt-1`} value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} placeholder="Optional" /></label>
          </div>
          <button onClick={saveAbout} disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg">{busy ? "Saving…" : "Continue"}</button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Who are you here, and what do you want?</h2>
          <p className="text-sm text-gray-400 mt-1">Tick everything that applies. We take you to the right place, and show exactly what each one needs.</p>
          <div className="mt-4 space-y-6">
            {GROUPS.map((g) => (
              <div key={g.id}>
                <h3 className="font-bold text-white">{g.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{g.text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTERESTS.filter((i) => i.group === g.id).map((i) => {
                    const on = picked.includes(i.id)
                    return (
                      <button key={i.id} onClick={() => toggle(i.id)} aria-pressed={on} className={`text-left rounded-xl border p-4 ${on ? "border-red-500 bg-red-950/30" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                  <div className="flex items-start justify-between gap-3"><span className="font-semibold">{i.title}</span><span className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center ${on ? "bg-red-600 border-red-600" : "border-white/30"}`}>{on && <Check className="w-3.5 h-3.5" />}</span></div>
                  <p className="text-sm text-gray-400 mt-1">{NEEDS[i.id]?.what}</p>{NEEDS[i.id]?.value && <p className="text-sm text-emerald-300/90 mt-2"><b>What you get:</b> {NEEDS[i.id].value}</p>}
                </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <label className="block mt-5 text-sm text-gray-300">What do you most want to learn or get from Hell Road? (optional)
            <textarea className="w-full px-3 py-2.5 mt-1 rounded-lg bg-black border border-white/10 text-white text-sm" rows={2} maxLength={500} value={learn} onChange={(e) => setLearn(e.target.value)} />
          </label>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="border border-white/20 px-5 py-2.5 rounded-lg">Back</button>
            <button onClick={saveInterests} disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg">{busy ? "Saving…" : "Continue"}</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Your next steps</h2>
          <p className="text-sm text-gray-400 mt-1">Your profile is saved. Here is what is left for what you chose.</p>
          <ul className="mt-5 space-y-3">
            <li className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">{kycCase?.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-600 mt-0.5" />}
                <div><div className="font-semibold">Verify your identity (KYC)</div><p className="text-sm text-gray-400">Needed for sellers, intermediaries, parties and larger payments. {kycCase?.status === "submitted" ? "Yours is under review." : kycCase?.status === "approved" ? "" : "You can do it now or skip for now, but you have 7 days. After 7 days your account locks until you verify or ask for access again."}</p></div></div>
              {kycCase?.status !== "approved" && <div className="flex gap-2 self-start sm:self-center"><Link href="/kyc" className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">{kycCase ? "Open KYC" : "Verify now"}</Link><button onClick={finish} className="whitespace-nowrap border border-white/20 hover:border-white/40 text-sm font-semibold px-4 py-2 rounded-lg">Skip for now</button></div>}
            </li>
            {picked.filter((i) => NEEDS[i]).map((i) => (
              <li key={i} className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><div className="font-semibold">{INTERESTS.find((x) => x.id === i)?.title}</div><p className="text-sm text-gray-400"><span className="text-gray-300">What it takes:</span> {NEEDS[i].needed}</p></div>
                <Link href={NEEDS[i].href} className="self-start sm:self-center whitespace-nowrap bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">{NEEDS[i].cta}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-bold">How to sign in next time</h3>
            <p className="text-sm text-gray-400 mt-1">Same steps on a phone, an iPad or a computer. Save this page or screenshot it.</p>
            <ol className="mt-4 space-y-3 text-sm text-gray-200 list-decimal pl-5">
              <li>Open <b>community.marketunderworld.com</b> in your browser.</li>
              <li>Tap <b>Sign in</b>. On a phone it is in the top bar or the menu.</li>
              <li>Enter the access code if it asks. Your access code is <b className="font-mono tracking-widest text-red-300">UNDERGROUND</b> (capital letters do not matter). Your device remembers it for 30 days, a new device or browser asks again.</li>
              <li>Type your email and password, then tap Sign in. If you forgot your password, tap <b>Forgot password</b> and we email you a link.</li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">Keep the code private. It is for members only.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setStep(1)} className="border border-white/20 px-5 py-2.5 rounded-lg">Back</button>
            <button onClick={finish} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg">Take me there</button>
            <Link href="/dashboard" className="px-5 py-2.5 rounded-lg text-gray-300 underline">Go to my dashboard</Link>
          </div>
        </section>
      )}
    </div>
  )
}

// Visitors who are not signed in just see what each choice needs; members get the profile wizard.
function Guide() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-20">
      <h1 className="text-3xl font-bold">What do you want to do here?</h1>
      <p className="text-gray-400 mt-2">Here is what each part of Hell Road gives you and what it takes. Create a free account to set up your profile and go straight to what you need.</p>
      <ul className="mt-8 space-y-3">
        {INTERESTS.map((i) => (
          <li key={i.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="font-semibold">{i.title}</div>
            <p className="text-sm text-gray-400 mt-1">{NEEDS[i.id]?.what} <span className="text-gray-300">What it takes:</span> {NEEDS[i.id]?.needed}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex gap-3">
        <Link href="/auth/registration" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg">Create an account</Link>
        <Link href="/auth/signin?redirect=/onboarding" className="border border-white/20 px-6 py-2.5 rounded-lg">Sign in</Link>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const body = useCallback(() => (isLoading ? <div className="pt-40 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div> : isAuthenticated ? <Suspense fallback={null}><Wizard /></Suspense> : <Guide />), [isAuthenticated, isLoading])
  return (
    <div className="min-h-screen bg-[#0B0C0F] text-white">
      <Navbar />
      {body()}
      <Footer />
    </div>
  )
}
