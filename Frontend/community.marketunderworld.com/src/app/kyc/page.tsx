"use client"

import { useAuth } from "@/context/auth-context"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { ShieldCheck, AlertCircle } from "lucide-react"
import { kyc, fileToDataUrl, ApiError, type IdType, type KycCase } from "@/lib/api/kyc"

const field = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-cyan-500/50 text-white"
const label = "block text-xs font-bold text-gray-400 uppercase mb-2"

function KycInner() {
  const next = useSearchParams().get("next")
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [current, setCurrent] = useState<KycCase | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ fullName: "", dateOfBirth: "", nationality: "", idType: "passport" as IdType, idNumberLast4: "" })
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }
    kyc.mine()
      .then(setCurrent)
      .catch((err) => (err instanceof ApiError && err.status === 401 ? setNeedsLogin(true) : setError(err instanceof Error ? err.message : "Could not load your status")))
      .finally(() => setLoading(false))
  }, [authLoading, isAuthenticated])

  const submit = async () => {
    setError("")
    if (!idFile || !selfieFile) return setError("Add both your ID and a selfie.")
    setSending(true)
    try {
      const [idDocument, selfie] = await Promise.all([fileToDataUrl(idFile), fileToDataUrl(selfieFile)])
      setCurrent(await kyc.submit({ ...form, idDocument, selfie }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your verification")
    } finally {
      setSending(false)
    }
  }

  const canSubmit = !current || current.status === "rejected" || current.status === "expired"

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      <main className="container max-w-2xl mx-auto px-6 pt-40 pb-32 space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-brand-green" /> Verify your identity</h1>
          <p className="text-text-secondary">
            Some listings, such as investment opportunities, can only be bought by verified people. You verify once and it covers you for 24 months.
            An admin checks your ID against your selfie. Your documents are encrypted, only reviewers can open them, and they are deleted after the retention period.
          </p>
        </header>

        {loading && <p className="text-text-muted">Loading…</p>}
        {needsLogin && <SignInNotice next="/kyc" what="verify your identity" />}

        {current && current.status === "submitted" && (
          <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm">Your documents were received and are waiting for review. You can leave this page; we will use your account once it is approved.</div>
        )}
        {current && current.status === "approved" && (
          <div className="p-5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-200 text-sm space-y-3">
            <p>You are verified{current.expiresAt ? ` until ${new Date(current.expiresAt).toLocaleDateString("en-IN")}` : ""}.</p>
            <Link href={next && next.startsWith("/") ? next : "/shop"} className="inline-block h-11 leading-[2.75rem] px-6 rounded-lg bg-brand-green text-brand-void font-bold">Continue</Link>
          </div>
        )}
        {current && current.status === "rejected" && (
          <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">Your verification was not approved{current.rejectionReason ? `: ${current.rejectionReason}` : "."} You can submit again below.</div>
        )}
        {current && current.status === "expired" && (
          <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm">Your verification has expired. Submit your documents again to renew it.</div>
        )}

        {!loading && !needsLogin && canSubmit && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className={label}>Full name (as on ID)</label><input className={field} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div><label className={label}>Date of birth</label><input type="date" className={field} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
              <div><label className={label}>Nationality</label><input className={field} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
              <div><label className={label}>ID type</label>
                <select className={field} value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value as IdType })}>
                  <option value="passport">Passport</option><option value="government_id">Government ID</option><option value="driving_license">Driving licence</option>
                </select></div>
              <div><label className={label}>Last 4 characters of ID number</label><input className={field} maxLength={4} value={form.idNumberLast4} onChange={(e) => setForm({ ...form, idNumberLast4: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className={label}>Photo of your ID</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} className="text-sm text-text-secondary" /></div>
              <div><label className={label}>Selfie holding your ID</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} className="text-sm text-text-secondary" /></div>
            </div>
            {error && <p role="alert" className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
            <button onClick={submit} disabled={sending} className="w-full h-14 rounded-xl bg-brand-green text-brand-void font-bold text-lg disabled:opacity-60">{sending ? "Encrypting and uploading…" : "Submit for verification"}</button>
          </div>
        )}
        {error && !canSubmit && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </main>
      <Footer />
    </div>
  )
}

export default function KycPage() {
  return <Suspense fallback={null}><KycInner /></Suspense>
}
