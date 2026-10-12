"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, ShieldCheck, Send, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { loadKycWindow } from "@/lib/kyc-status"
import { myRequests, sendRequest, type AccessRequest } from "@/lib/api/profile"

export default function AccessBlockedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [req, setReq] = useState<AccessRequest | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.replace("/auth/signin?redirect=/access-blocked"); return }
    Promise.all([loadKycWindow(true), myRequests().catch(() => [] as AccessRequest[])]).then(([w, list]) => {
      if (w && w.state !== "blocked") { router.replace("/dashboard"); return }
      setReq(list.find((r) => r.department === "account_access" && (r.status === "pending" || r.status === "declined")) ?? null)
      setReady(true)
    })
  }, [isLoading, isAuthenticated, router])

  const send = async () => {
    setBusy(true); setError("")
    try { setReq(await sendRequest("account_access", note.trim() || "Please open my account again. I will verify my identity.")) }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send your request") }
    finally { setBusy(false) }
  }

  if (!ready) return <main className="min-h-[100dvh] bg-[#0A0A0F]" />
  return (
    <main className="min-h-[100dvh] bg-[#0A0A0F] text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center"><div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-600/50 flex items-center justify-center"><Lock className="w-8 h-8 text-red-400" /></div></div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Your account is locked</h1>
          <p className="text-gray-400">You had 7 days to verify your identity and that time is over. Nothing was deleted. Do one of these to get back in.</p>
        </div>

        <Link href="/kyc" className="block rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3 font-semibold"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Option 1: Verify now (fastest)</div>
          <p className="text-sm text-gray-300 mt-1">Send your ID and a selfie. Submitting opens your account again while we review it.</p>
        </Link>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center gap-3 font-semibold"><Send className="w-5 h-5 text-red-400" /> Option 2: Ask for access again</div>
          {req?.status === "pending" ? (
            <p className="text-sm text-amber-200 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> Your request is with the team. You will get a notification when it is answered, usually within a day.</p>
          ) : (
            <>
              {req?.status === "declined" && <p className="text-sm text-red-300">Your last request was declined{req.decisionNote ? `: ${req.decisionNote}` : "."} You can write again.</p>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Tell us why you need access (optional)" className="w-full rounded-lg bg-black border border-white/15 p-3 text-base focus:outline-none focus:border-red-500" />
              {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
              <button onClick={send} disabled={busy} className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 font-semibold">{busy ? "Sending…" : "Send request"}</button>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-500">Need help? <Link href="/support" className="underline">Contact support</Link></p>
      </div>
    </main>
  )
}
