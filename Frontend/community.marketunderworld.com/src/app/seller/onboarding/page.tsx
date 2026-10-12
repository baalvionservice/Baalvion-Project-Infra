"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, Clock, Loader2, XCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { listMySellerApplications, submitSellerApplication, type SellerApplication, type SellerDetails } from "@/lib/api/commerce-admin"

const DRAFT_KEY = "hr_seller_application_draft_v1"
const COUNTRIES = [
  { label: "India", code: "IN", currency: "INR" }, { label: "United States", code: "US", currency: "USD" },
  { label: "United Kingdom", code: "GB", currency: "GBP" }, { label: "United Arab Emirates", code: "AE", currency: "AED" },
  { label: "Singapore", code: "SG", currency: "SGD" }, { label: "Germany", code: "DE", currency: "EUR" },
]
const SUGGESTED = ["Electronics", "Phones and accessories", "Fashion", "Beauty", "Home and kitchen", "Gaming", "Books and courses", "Collectibles", "Gift cards", "Services"]

const box = "w-full h-11 px-3 rounded-lg bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
const area = "w-full px-3 py-2.5 rounded-lg bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "store"

function Section({ n, title, hint, done, children }: { n: number; title: string; hint: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
      <div className="flex items-start gap-3 mb-5">
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-emerald-600 text-white" : "bg-white/10 text-gray-300"}`}>{done ? <CheckCircle2 className="w-4 h-4" /> : n}</span>
        <div><h2 className="text-lg font-bold">{title}</h2><p className="text-sm text-gray-500">{hint}</p></div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
const Field = ({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) => (
  <label className="block">
    <span className="text-sm text-gray-300">{label}{required && <span className="text-red-400"> *</span>}</span>
    {children}
    {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
  </label>
)

interface Form {
  storeName: string; sellsWhat: string; productTypes: string[]; country: string; city: string; businessType: "" | "individual" | "business"
  yearsSelling: string; stockLevel: string; phone: string; contactEmail: string; website: string; instagram: string; address: string
  samples: { name: string; price: string; note: string }[]
  shippingMethod: string; handlingDays: string; shipsTo: string; returns: string
  legalFullName: string; dateOfBirth: string; idLast4: string; payoutCoin: string; payoutWallet: string; agreed: boolean
}
const EMPTY: Form = {
  storeName: "", sellsWhat: "", productTypes: [], country: "IN", city: "", businessType: "", yearsSelling: "", stockLevel: "", phone: "", contactEmail: "", website: "", instagram: "", address: "",
  samples: [{ name: "", price: "", note: "" }], shippingMethod: "", handlingDays: "", shipsTo: "", returns: "",
  legalFullName: "", dateOfBirth: "", idLast4: "", payoutCoin: "USDT", payoutWallet: "", agreed: false,
}
const adult = (dob: string) => { const d = new Date(dob); if (isNaN(+d)) return false; const t = new Date(); t.setFullYear(t.getFullYear() - 18); return d <= t }

export default function SellerOnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [apps, setApps] = useState<SellerApplication[] | null>(null)
  const [f, setF] = useState<Form>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [tag, setTag] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.push("/auth/signin?redirect=" + encodeURIComponent("/seller/onboarding")); return }
    listMySellerApplications().then(setApps).catch(() => setApps([]))
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) setF({ ...EMPTY, ...JSON.parse(raw) }) } catch { /* ignore */ }
  }, [authLoading, isAuthenticated, router])
  useEffect(() => { if (user?.email) setF((cur) => (cur.contactEmail ? cur : { ...cur, contactEmail: user.email })) }, [user?.email])
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...f, agreed: false })) } catch { /* ignore */ } }, [f])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((cur) => ({ ...cur, [k]: v }))
  const setSample = (i: number, patch: Partial<Form["samples"][number]>) => setF((cur) => ({ ...cur, samples: cur.samples.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const addTag = (t: string) => { const v = t.trim(); if (v && !f.productTypes.includes(v) && f.productTypes.length < 12) set("productTypes", [...f.productTypes, v]); setTag("") }

  const checks = useMemo(() => [
    { ok: f.storeName.trim().length >= 2, label: "Store name", sec: 1 },
    { ok: f.sellsWhat.trim().length >= 20, label: "What you sell (a sentence or two)", sec: 1 },
    { ok: !!f.city.trim() && !!f.businessType, label: "City and whether you sell as a person or a business", sec: 1 },
    { ok: f.phone.trim().length >= 7, label: "Phone or WhatsApp number", sec: 2 },
    { ok: !!f.samples[0]?.name.trim(), label: "At least one sample product", sec: 3 },
    { ok: !!f.shippingMethod && f.handlingDays !== "" && !!f.returns, label: "How you ship and your returns", sec: 4 },
    { ok: f.legalFullName.trim().length >= 3 && adult(f.dateOfBirth), label: "Your legal name and date of birth (18 or older)", sec: 5 },
    { ok: f.agreed, label: "Accept the seller terms", sec: 5 },
  ], [f])
  const done = checks.filter((c) => c.ok).length
  const secDone = (n: number) => checks.filter((c) => c.sec === n).every((c) => c.ok)

  const submit = async () => {
    setBusy(true)
    const country = COUNTRIES.find((c) => c.code === f.country) ?? COUNTRIES[0]
    const details: SellerDetails = {
      businessType: f.businessType || undefined, city: f.city.trim() || undefined, address: f.address.trim() || undefined, contactEmail: f.contactEmail.trim() || undefined,
      whatsapp: f.phone.trim() || undefined, website: f.website.trim() || undefined, instagram: f.instagram.trim() || undefined,
      yearsSelling: (f.yearsSelling || undefined) as SellerDetails["yearsSelling"], sellsWhat: f.sellsWhat.trim(), productTypes: f.productTypes,
      stockLevel: (f.stockLevel || undefined) as SellerDetails["stockLevel"],
      sampleProducts: f.samples.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), price: s.price.trim() || undefined, note: s.note.trim() || undefined })),
      shippingMethod: f.shippingMethod as SellerDetails["shippingMethod"], handlingDays: Number(f.handlingDays), shipsTo: f.shipsTo.trim() || undefined,
      returns: f.returns as SellerDetails["returns"], idNumberLast4: f.idLast4.trim() || undefined,
    }
    try {
      const app = await submitSellerApplication({
        storeName: f.storeName.trim(), storeCode: slug(f.storeName), countryCode: country.code, currencyCode: country.currency,
        description: f.sellsWhat.trim(), legalFullName: f.legalFullName.trim(), dateOfBirth: f.dateOfBirth, phoneNumber: f.phone.trim(),
        payoutCurrency: f.payoutWallet.trim() ? f.payoutCoin : undefined, payoutWalletAddress: f.payoutWallet.trim() || undefined, details,
      })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      setApps([app, ...(apps ?? [])])
      window.scrollTo({ top: 0 })
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't send your application", description: e instanceof Error ? e.message : "Please try again." })
    } finally { setBusy(false) }
  }

  if (authLoading || apps === null) return <div className="min-h-screen bg-[#050508] pt-32 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>

  const latest = apps[0]
  const pending = apps.find((a) => a.status === "pending")
  const approved = apps.find((a) => a.status === "approved")

  if (pending || approved) {
    const a = (pending ?? approved)!
    return (
      <div className="min-h-screen bg-[#050508] text-white px-5 pt-28 pb-24">
        <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5 text-center">
          {pending ? <Clock className="w-12 h-12 text-amber-400 mx-auto" /> : <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />}
          <h1 className="text-2xl font-bold">{pending ? "Your application is being reviewed" : "You are approved as a seller"}</h1>
          <p className="text-gray-400"><strong className="text-white">{a.storeName}</strong>{pending ? " is waiting for an admin. You will get a notification as soon as there is a decision." : " can sell on Hell Road."}</p>
          {approved && (
            <ol className="text-left text-sm text-gray-300 space-y-2 bg-black/40 rounded-xl p-5">
              <li><strong className="text-white">1. Choose where you sell.</strong> Pay once for each category you want to sell in. <Link className="underline" href="/seller/access">Open category payments</Link></li>
              <li><strong className="text-white">2. Add your products.</strong> Photos, price, description. <Link className="underline" href="/seller/listings/new">Add a product</Link></li>
              <li><strong className="text-white">3. Publish.</strong> Once your category is paid, your listing goes live in the marketplace straight away.</li>
            </ol>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/dashboard" className="px-5 py-2.5 rounded-lg border border-white/15 text-sm">Go to my dashboard</Link>
            {approved && <Link href="/seller/listings" className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold">My listings</Link>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white px-4 sm:px-6 pt-28 pb-32">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <p className="text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em]">Sell on Hell Road</p>
          <h1 className="text-3xl font-bold mt-1">Apply to become a seller</h1>
          <p className="text-gray-400 mt-2 text-sm">One page, about five minutes. Your answers are saved on this device as you type, so you can leave and come back. An admin reads every application. When you are approved and have paid for your category, your products go straight into the marketplace.</p>
          {latest?.status === "rejected" && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-300"><XCircle className="w-4 h-4 mt-0.5 shrink-0" /> Your last application was not approved{latest.rejectionReason ? `: ${latest.rejectionReason}` : "."} You can fix things and apply again.</div>
          )}
        </header>

        <div className="sticky top-16 z-30 -mx-1 px-1 py-2 bg-[#050508]/95 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5"><span>{done} of {checks.length} done</span><span>{checks.find((c) => !c.ok)?.label ? `Next: ${checks.find((c) => !c.ok)!.label}` : "Ready to send"}</span></div>
          <div className="h-1.5 rounded bg-white/10"><div className="h-1.5 rounded bg-emerald-500 transition-all" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
        </div>

        <Section n={1} title="Your store" hint="What you call it and what you sell." done={secDone(1)}>
          <Field label="Store name" required><input className={box} value={f.storeName} maxLength={80} onChange={(e) => set("storeName", e.target.value)} placeholder="e.g. Mumbai Mobile Hub" /></Field>
          <Field label="What do you sell?" required hint={`${f.sellsWhat.trim().length} characters. Say what the products are, where they come from and what makes them good.`}>
            <textarea className={area} rows={3} maxLength={600} value={f.sellsWhat} onChange={(e) => set("sellsWhat", e.target.value)} placeholder="e.g. New and refurbished smartphones with a 6 month warranty, sourced from authorised distributors." />
          </Field>
          <div>
            <span className="text-sm text-gray-300">Product types</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED.map((t) => <button type="button" key={t} onClick={() => (f.productTypes.includes(t) ? set("productTypes", f.productTypes.filter((x) => x !== t)) : addTag(t))} aria-pressed={f.productTypes.includes(t)} className={`px-3 py-1.5 rounded-full text-xs border ${f.productTypes.includes(t) ? "bg-red-600 border-red-600" : "border-white/15 text-gray-300 hover:border-white/30"}`}>{t}</button>)}
              {f.productTypes.filter((t) => !SUGGESTED.includes(t)).map((t) => <button type="button" key={t} onClick={() => set("productTypes", f.productTypes.filter((x) => x !== t))} className="px-3 py-1.5 rounded-full text-xs bg-red-600">{t} ×</button>)}
            </div>
            <input className={`${box} mt-2 max-w-xs`} value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tag) } }} placeholder="Something else? Type it and press Enter" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Country" required><select className={box} value={f.country} onChange={(e) => set("country", e.target.value)}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.currency})</option>)}</select></Field>
            <Field label="City" required><input className={box} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Pune" /></Field>
            <Field label="You sell as" required><select className={box} value={f.businessType} onChange={(e) => set("businessType", e.target.value as Form["businessType"])}><option value="">Choose</option><option value="individual">A person</option><option value="business">A registered business</option></select></Field>
            <Field label="How long have you been selling?"><select className={box} value={f.yearsSelling} onChange={(e) => set("yearsSelling", e.target.value)}><option value="">Choose</option><option value="new">Just starting</option><option value="under_1">Under a year</option><option value="1_to_3">1 to 3 years</option><option value="over_3">More than 3 years</option></select></Field>
            <Field label="How much stock do you have?"><select className={box} value={f.stockLevel} onChange={(e) => set("stockLevel", e.target.value)}><option value="">Choose</option><option value="under_20">Under 20 items</option><option value="20_to_100">20 to 100 items</option><option value="over_100">More than 100 items</option></select></Field>
          </div>
        </Section>

        <Section n={2} title="How buyers and we can reach you" hint="Only the Hell Road team sees these." done={secDone(2)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone or WhatsApp" required><input className={box} inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 …" /></Field>
            <Field label="Email"><input className={box} type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
            <Field label="Website or shop link"><input className={box} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
            <Field label="Instagram or other profile"><input className={box} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@yourshop" /></Field>
          </div>
          <Field label="Business or pickup address"><input className={box} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, area, city, pincode" /></Field>
        </Section>

        <Section n={3} title="Show us what you sell" hint="Add up to three real products you plan to list. It helps us approve you faster." done={secDone(3)}>
          {f.samples.map((s, i) => (
            <div key={i} className="grid sm:grid-cols-[2fr_1fr] gap-3 p-4 rounded-xl border border-white/10">
              <Field label={`Product ${i + 1}`} required={i === 0}><input className={box} value={s.name} maxLength={120} onChange={(e) => setSample(i, { name: e.target.value })} placeholder="Product name" /></Field>
              <Field label="Price"><input className={box} value={s.price} maxLength={40} onChange={(e) => setSample(i, { price: e.target.value })} placeholder="e.g. ₹12,999" /></Field>
              <div className="sm:col-span-2"><Field label="A line about it"><input className={box} value={s.note} maxLength={300} onChange={(e) => setSample(i, { note: e.target.value })} placeholder="Condition, brand, warranty…" /></Field></div>
              {i > 0 && <button type="button" onClick={() => set("samples", f.samples.filter((_, idx) => idx !== i))} className="text-xs text-red-300 underline justify-self-start">Remove</button>}
            </div>
          ))}
          {f.samples.length < 3 && <button type="button" onClick={() => set("samples", [...f.samples, { name: "", price: "", note: "" }])} className="text-sm text-cyan-400">+ Add another product</button>}
        </Section>

        <Section n={4} title="Shipping and returns" hint="So buyers know what to expect." done={secDone(4)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="How do you deliver?" required><select className={box} value={f.shippingMethod} onChange={(e) => set("shippingMethod", e.target.value)}><option value="">Choose</option><option value="courier">I ship with a courier</option><option value="self">I deliver myself</option><option value="pickup">Buyer collects</option></select></Field>
            <Field label="Days to prepare an order" required><input className={box} inputMode="numeric" value={f.handlingDays} onChange={(e) => set("handlingDays", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="e.g. 2" /></Field>
            <Field label="Where do you deliver?"><input className={box} value={f.shipsTo} onChange={(e) => set("shipsTo", e.target.value)} placeholder="e.g. All India" /></Field>
            <Field label="Returns" required><select className={box} value={f.returns} onChange={(e) => set("returns", e.target.value)}><option value="">Choose</option><option value="7_days">7 days</option><option value="14_days">14 days</option><option value="30_days">30 days</option><option value="none">No returns</option></select></Field>
          </div>
        </Section>

        <Section n={5} title="Who you are and how you get paid" hint="We check your identity before approving. You will also verify with an ID photo under KYC." done={secDone(5)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full legal name" required><input className={box} value={f.legalFullName} onChange={(e) => set("legalFullName", e.target.value)} placeholder="As on your ID" /></Field>
            <Field label="Date of birth" required hint="You must be 18 or older."><input className={box} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></Field>
            <Field label="Last 4 characters of your ID number"><input className={box} maxLength={4} value={f.idLast4} onChange={(e) => set("idLast4", e.target.value)} /></Field>
            <div />
            <Field label="Payout coin"><select className={box} value={f.payoutCoin} onChange={(e) => set("payoutCoin", e.target.value)}><option>USDT</option><option>BTC</option><option>ETH</option></select></Field>
            <Field label="Your wallet address (you can add it later)"><input className={box} value={f.payoutWallet} onChange={(e) => set("payoutWallet", e.target.value)} /></Field>
          </div>
          <p className="text-xs text-gray-500">Next step after approval: <Link className="underline" href="/kyc">verify your identity (KYC)</Link> if you have not already.</p>
          <label className="flex items-start gap-3 text-sm text-gray-200 pt-2">
            <input type="checkbox" className="mt-1 accent-red-600" checked={f.agreed} onChange={(e) => set("agreed", e.target.checked)} />
            <span>I confirm the details are true, and I accept the <Link className="underline" href="/terms">Terms of use</Link> and the <Link className="underline" href="/refund-policy">Refund policy</Link>.</span>
          </label>
        </Section>

        <div className="rounded-2xl border border-white/10 p-5 space-y-3">
          {done < checks.length && (
            <ul className="text-sm text-gray-400 space-y-1">{checks.filter((c) => !c.ok).map((c) => <li key={c.label} className="flex items-center gap-2"><Circle className="w-3.5 h-3.5" /> {c.label}</li>)}</ul>
          )}
          <button onClick={submit} disabled={busy || done < checks.length} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-lg">{busy ? "Sending…" : "Send my application"}</button>
        </div>
      </div>
    </div>
  )
}
