"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { PayToPanel } from "@/components/payments/pay-to-panel"
import { ReviewStatus } from "@/components/payments/review-status"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTierStatuses, startTierPayment, submitPayment, type TierStatus } from "@/lib/api/community-access"
import { listPaymentMethods, type PaymentMethod, type PaymentMethodInfo } from "@/lib/api/seller-access"

function PayInner() {
  const router = useRouter()
  const slug = useSearchParams().get("tier") || ""
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [tier, setTier] = useState<TierStatus | null | undefined>(undefined)
  const [methods, setMethods] = useState<PaymentMethodInfo[]>([])
  const [method, setMethod] = useState<PaymentMethod>("USDT")
  const [network, setNetwork] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([getTierStatuses(), listPaymentMethods().catch(() => [])])
    setTier(s.tiers.find((t) => t.slug === slug) ?? null)
    setMethods(m)
    setMethod((cur) => (m.find((x) => x.method === cur && x.available) ? cur : (m.find((x) => x.available)?.method ?? cur)))
    setNetwork((cur) => {
      const usdt = m.find((x) => x.method === "USDT")
      return usdt?.networks.find((n) => n.network === cur && n.available) ? cur : (usdt?.networks.find((n) => n.available)?.network ?? "")
    })
  }, [slug])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.push(`/auth/signin?redirect=/access/pay?tier=${slug}`); return }
    load().catch(() => setTier(null))
  }, [authLoading, isAuthenticated, router, load, slug])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })
  const start = async () => {
    setBusy(true)
    try { await startTierPayment(slug, method, method === "USDT" ? network : undefined); await load() } catch (e) { fail("Couldn't start payment", e) } finally { setBusy(false) }
  }
  const submit = async (body: Parameters<typeof submitPayment>[1]) => {
    if (!tier?.payment) return
    setBusy(true)
    try { await submitPayment(tier.payment.id, body); await load() } catch (e) { fail("Couldn't submit", e) } finally { setBusy(false) }
  }

  if (tier === undefined) return <div className="pt-40 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  if (tier === null) return <div className="pt-40 text-center text-gray-400">That access tier does not exist. <Link className="underline" href="/access">See all tiers</Link></div>

  const pay = tier.payment
  const usdt = methods.find((m) => m.method === "USDT")

  return (
    <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 space-y-8">
      <header className="space-y-3">
        <p className="text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em]">Access</p>
        <h1 className="text-3xl font-bold">{tier.name} · ${tier.priceUsd.toLocaleString()}</h1>
        <p className="text-gray-400 text-sm">Pay the amount to the address shown, attach a screenshot of the payment, and send it. An admin checks it, usually within the wait time shown, and then your access switches on. You will see the status here.</p>
      </header>

      {pay?.status === "active" ? (
        <NexusCard className="p-8 bg-emerald-500/5 border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /><h2 className="text-xl font-bold">Access granted</h2></div>
          <p className="text-sm text-gray-400">Your payment was confirmed and {tier.name} is active on your account.</p>
          <Link href={slug === "marketplace-access" ? "/marketplace" : "/forum"}><NexusButton>{slug === "marketplace-access" ? "Go to the marketplace" : "Go to the forum"}</NexusButton></Link>
        </NexusCard>
      ) : pay?.status === "payment_submitted" ? (
        <NexusCard className="p-8 bg-white/[0.02] border-white/10"><ReviewStatus payment={pay} onRefresh={load} /></NexusCard>
      ) : pay?.status === "awaiting_payment" ? (
        <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-4">
          <h2 className="text-xl font-bold">Pay ${tier.priceUsd.toLocaleString()}</h2>
          <PayToPanel payment={pay} amountUsd={tier.priceUsd} busy={busy} onSubmit={submit} />
        </NexusCard>
      ) : (
        <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-6">
          {pay?.status === "rejected" && <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-300"><XCircle className="w-4 h-4 mt-0.5 shrink-0" /> We couldn&apos;t find that payment{pay.note ? `: ${pay.note}` : "."} You can start again.</div>}
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">Pay with</p>
            <div className="flex gap-2 flex-wrap">
              {methods.map((m) => (
                <button key={m.method} onClick={() => setMethod(m.method)} disabled={!m.available}
                  className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40 ${method === m.method ? "bg-[#39FF14] text-black" : "bg-black border border-white/10 text-gray-400"}`}>{m.label}</button>
              ))}
            </div>
            {method === "USDT" && usdt && (
              <div className="flex gap-2 flex-wrap">
                {usdt.networks.map((n) => (
                  <button key={n.network} onClick={() => setNetwork(n.network)} disabled={!n.available}
                    className={`px-3 h-8 rounded-lg text-xs font-bold disabled:opacity-40 ${network === n.network ? "bg-white text-black" : "bg-black border border-white/10 text-gray-400"}`}>{n.label}</button>
                ))}
              </div>
            )}
          </div>
          <NexusButton onClick={start} disabled={busy || !methods.some((m) => m.available)}>{busy ? "Starting…" : `Continue to pay $${tier.priceUsd.toLocaleString()}`}</NexusButton>
          {!methods.some((m) => m.available) && <p className="text-xs text-gray-500">Payments are not available right now. Please try again later.</p>}
        </NexusCard>
      )}
      <p className="text-xs text-gray-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Payments go straight to the platform&apos;s wallet and are confirmed by an admin. See the <Link className="underline" href="/refund-policy">refund policy</Link>.</p>
    </div>
  )
}

export default function AccessPayPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <Suspense fallback={null}><PayInner /></Suspense>
      <Footer />
    </div>
  )
}
