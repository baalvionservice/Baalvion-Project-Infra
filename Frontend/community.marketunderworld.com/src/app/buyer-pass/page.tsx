"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { PayToPanel } from "@/components/payments/pay-to-panel"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getBuyerAccess, startAccessPass, submitPaymentHash, type BuyerAccessStatus } from "@/lib/api/buyer-access"
import { listPaymentMethods, type PaymentMethod, type PaymentMethodInfo } from "@/lib/api/seller-access"

export default function BuyerPassPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<BuyerAccessStatus | null>(null)
  const [methods, setMethods] = useState<PaymentMethodInfo[]>([])
  const [method, setMethod] = useState<PaymentMethod>("USDT")
  const [network, setNetwork] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([getBuyerAccess(), listPaymentMethods().catch(() => [])])
    setStatus(s); setMethods(m)
    setMethod((cur) => (m.find((x) => x.method === cur && x.available) ? cur : (m.find((x) => x.available)?.method ?? cur)))
    setNetwork((cur) => {
      const usdt = m.find((x) => x.method === "USDT")
      return usdt?.networks.find((n) => n.network === cur && n.available) ? cur : (usdt?.networks.find((n) => n.available)?.network ?? "")
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/buyer-pass"); return }
    load().catch(() => setStatus(null)).finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, router, load])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })

  const start = async () => {
    setBusy(true)
    try { await startAccessPass(method, method === "USDT" ? network : undefined); await load() } catch (e) { fail("Couldn't start payment", e) } finally { setBusy(false) }
  }
  const submit = async (txHash: string) => {
    if (!status?.payment) return
    setBusy(true)
    try { await submitPaymentHash(status.payment.id, txHash); await load() } catch (e) { fail("Couldn't submit", e) } finally { setBusy(false) }
  }

  if (loading || authLoading) return <div className="min-h-screen bg-[#050508] pt-32 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>

  const price = status?.priceUsd ?? 50
  const pay = status?.payment
  const usdt = methods.find((m) => m.method === "USDT")

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-28 pb-32">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        <header className="space-y-3">
          <p className="text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em]">Buyer access</p>
          <h1 className="text-4xl font-bold tracking-tight">Enter the marketplace</h1>
          <p className="text-gray-400">A one-time ${price} access pass lets you browse every category and buy anything listed by our sellers. The pass is not refundable.</p>
        </header>

        {status?.hasAccess ? (
          <NexusCard className="p-8 bg-emerald-500/5 border-emerald-500/20 space-y-4">
            <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400" /><h2 className="text-xl font-bold">You&apos;re in</h2></div>
            <p className="text-sm text-gray-400">{status.reason === "admin" ? "Admins have full access." : status.reason === "seller" ? "Your seller account already includes marketplace access." : "Your access pass is active."}</p>
            <Link href="/shop"><NexusButton>Go to the marketplace</NexusButton></Link>
          </NexusCard>
        ) : pay?.status === "payment_submitted" ? (
          <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-3">
            <div className="flex items-center gap-3"><Clock className="w-6 h-6 text-amber-400" /><h2 className="text-xl font-bold">Waiting for confirmation</h2></div>
            <p className="text-sm text-gray-400">We received your reference <code className="text-white">{pay.txHash}</code>. An admin will confirm it after checking the payment, then your access starts. You can close this page and come back.</p>
          </NexusCard>
        ) : pay?.status === "awaiting_payment" ? (
          <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-4">
            <h2 className="text-xl font-bold">Pay ${price} to enter</h2>
            <PayToPanel payment={pay} amountUsd={price} busy={busy} onSubmitHash={submit} />
          </NexusCard>
        ) : (
          <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-6">
            {pay?.status === "rejected" && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-300"><XCircle className="w-4 h-4 mt-0.5 shrink-0" /> We couldn&apos;t find that payment{pay.note ? `: ${pay.note}` : "."} You can start again.</div>
            )}
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">Pay with</p>
              <div className="flex gap-2 flex-wrap">
                {methods.map((m) => (
                  <button key={m.method} onClick={() => setMethod(m.method)} disabled={!m.available}
                    className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${method === m.method ? "bg-[#39FF14] text-black" : "bg-black border border-white/10 text-gray-400"}`}>{m.label}</button>
                ))}
              </div>
              {method === "USDT" && usdt && (
                <div className="flex gap-2 flex-wrap items-center">
                  {usdt.networks.map((n) => (
                    <button key={n.network} onClick={() => setNetwork(n.network)} disabled={!n.available}
                      className={`px-3 h-8 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${network === n.network ? "bg-white text-black" : "bg-black border border-white/10 text-gray-400"}`}>{n.label}</button>
                  ))}
                </div>
              )}
            </div>
            <NexusButton onClick={start} disabled={busy || !methods.some((m) => m.available)}>{busy ? "Starting…" : `Get my access pass — $${price}`}</NexusButton>
            {!methods.some((m) => m.available) && <p className="text-xs text-gray-500">Payments are not available right now. Please try again later.</p>}
          </NexusCard>
        )}

        <p className="text-xs text-gray-600 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Payments go straight to the marketplace&apos;s wallet and are confirmed by an admin.</p>
      </div>
    </div>
  )
}
