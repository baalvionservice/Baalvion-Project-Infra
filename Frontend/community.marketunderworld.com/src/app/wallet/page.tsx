"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, Clock, Coins, Loader2, RotateCcw } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PayToPanel } from "@/components/payments/pay-to-panel"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getPointsWallet, startWalletTopup, submitPaymentHash, type PointsWallet } from "@/lib/api/points"
import { listPaymentMethods, type PaymentMethod, type PaymentMethodInfo } from "@/lib/api/seller-access"

const PRESETS = [50, 100, 250, 500]
const REASON: Record<string, { label: string; icon: typeof Coins }> = {
  topup: { label: "Wallet load", icon: ArrowDownLeft },
  purchase: { label: "Purchase", icon: ArrowUpRight },
  refund: { label: "Refund", icon: RotateCcw },
  adjustment: { label: "Adjustment", icon: Coins },
}
const STATUS_LABEL: Record<string, string> = { awaiting_payment: "Waiting for your payment", payment_submitted: "Being confirmed", active: "Credited", rejected: "Payment not found" }

export default function WalletPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [wallet, setWallet] = useState<PointsWallet | null>(null)
  const [methods, setMethods] = useState<PaymentMethodInfo[]>([])
  const [amount, setAmount] = useState<number>(100)
  const [method, setMethod] = useState<PaymentMethod>("USDT")
  const [network, setNetwork] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [w, m] = await Promise.all([getPointsWallet(), listPaymentMethods().catch(() => [])])
    setWallet(w); setMethods(m)
    setMethod((cur) => (m.find((x) => x.method === cur && x.available) ? cur : (m.find((x) => x.available)?.method ?? cur)))
    setNetwork((cur) => {
      const usdt = m.find((x) => x.method === "USDT")
      return usdt?.networks.find((n) => n.network === cur && n.available) ? cur : (usdt?.networks.find((n) => n.available)?.network ?? "")
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/wallet"); return }
    load().catch(() => setWallet(null)).finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, router, load])

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." })

  const start = async () => {
    setBusy(true)
    try { await startWalletTopup(amount, method, method === "USDT" ? network : undefined); await load() } catch (e) { fail("Couldn't start your wallet load", e) } finally { setBusy(false) }
  }
  const submit = async (txHash: string) => {
    if (!wallet?.openTopup) return
    setBusy(true)
    try { await submitPaymentHash(wallet.openTopup.id, txHash); await load() } catch (e) { fail("Couldn't submit", e) } finally { setBusy(false) }
  }

  if (loading || authLoading) return <div className="min-h-screen bg-[#050508] pt-32 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading your wallet…</div>
  if (!wallet) return <div className="min-h-screen bg-[#050508] pt-32 text-center text-gray-400">We couldn&apos;t load your wallet. Please try again.</div>

  const open = wallet.openTopup
  const usdt = methods.find((m) => m.method === "USDT")
  const inRange = amount >= wallet.minTopupUsd && amount <= wallet.maxTopupUsd
  const youGet = Math.round(amount * wallet.pointsPerUsd)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050508] text-white pt-28 pb-32">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <header className="space-y-2">
            <p className="text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em]">Wallet</p>
            <h1 className="text-4xl font-bold tracking-tight">Your points</h1>
            <p className="text-gray-400">Load your wallet with crypto and it becomes points. Points pay for anything in the marketplace. {wallet.pointsPerUsd} points = $1.</p>
          </header>

          <NexusCard className="p-8 bg-white/[0.02] border-white/10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-amber-400" /> Balance</p>
              <p className="text-5xl font-bold">{wallet.points.toLocaleString()} <span className="text-lg text-gray-500 font-medium">pts</span></p>
              <p className="text-sm text-gray-500 mt-1">≈ ${wallet.usdValue.toFixed(2)}</p>
            </div>
            <Link href="/shop"><NexusButton variant="secondary">Go shopping</NexusButton></Link>
          </NexusCard>

          {open?.status === "payment_submitted" ? (
            <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-3">
              <div className="flex items-center gap-3"><Clock className="w-6 h-6 text-amber-400" /><h2 className="text-xl font-bold">Waiting for confirmation</h2></div>
              <p className="text-sm text-gray-400">We received your reference <code className="text-white">{open.txHash}</code> for ${Number(open.amountUsd).toFixed(2)}. An admin will confirm it, and your points appear straight away. You can leave this page.</p>
            </NexusCard>
          ) : open?.status === "awaiting_payment" ? (
            <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-4">
              <h2 className="text-xl font-bold">Send ${Number(open.amountUsd).toFixed(2)} to load {Math.round(Number(open.amountUsd) * wallet.pointsPerUsd).toLocaleString()} points</h2>
              <PayToPanel payment={open} amountUsd={Number(open.amountUsd)} busy={busy} onSubmitHash={submit} />
            </NexusCard>
          ) : (
            <NexusCard className="p-8 bg-white/[0.02] border-white/10 space-y-6">
              <h2 className="text-xl font-bold">Load your wallet</h2>
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">Amount (USD)</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {PRESETS.map((p) => (
                    <button key={p} onClick={() => setAmount(p)} className={`px-4 h-9 rounded-lg text-sm font-bold ${amount === p ? "bg-[#39FF14] text-black" : "bg-black border border-white/10 text-gray-300"}`}>${p}</button>
                  ))}
                  <input type="number" min={wallet.minTopupUsd} max={wallet.maxTopupUsd} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} aria-label="Amount in USD"
                    className="w-28 h-9 px-3 rounded-lg bg-black border border-white/10 text-sm text-white" />
                </div>
                <p className="text-xs text-gray-500">{inRange ? <>You&apos;ll get <strong className="text-white">{youGet.toLocaleString()} points</strong>.</> : <>Load between ${wallet.minTopupUsd} and ${wallet.maxTopupUsd.toLocaleString()}.</>}</p>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">Pay with</p>
                <div className="flex gap-2 flex-wrap">
                  {methods.map((m) => (
                    <button key={m.method} onClick={() => setMethod(m.method)} disabled={!m.available}
                      className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${method === m.method ? "bg-[#39FF14] text-black" : "bg-black border border-white/10 text-gray-400"}`}>{m.label}</button>
                  ))}
                </div>
                {method === "USDT" && usdt && (
                  <div className="flex gap-2 flex-wrap">
                    {usdt.networks.map((n) => (
                      <button key={n.network} onClick={() => setNetwork(n.network)} disabled={!n.available}
                        className={`px-3 h-8 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${network === n.network ? "bg-white text-black" : "bg-black border border-white/10 text-gray-400"}`}>{n.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <NexusButton onClick={start} disabled={busy || !inRange || !methods.some((m) => m.available)}>{busy ? "Starting…" : `Load ${inRange ? `$${amount}` : "wallet"}`}</NexusButton>
            </NexusCard>
          )}

          {wallet.topups.some((t) => t.status === "rejected") && (
            <p className="text-xs text-red-300">A recent load could not be matched to a payment{wallet.topups.find((t) => t.status === "rejected")?.note ? `: ${wallet.topups.find((t) => t.status === "rejected")?.note}` : ""}. Start a new one if you still want to load.</p>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Activity</h2>
            {wallet.history.length === 0 ? (
              <NexusCard className="p-8 text-center bg-white/[0.02] border-white/5 text-sm text-gray-500">Nothing yet. Load your wallet to get started.</NexusCard>
            ) : (
              <NexusCard className="p-0 bg-white/[0.02] border-white/5 divide-y divide-white/5">
                {wallet.history.map((h) => {
                  const r = REASON[h.reason] ?? REASON.adjustment
                  const Icon = r.icon
                  return (
                    <div key={h.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${h.delta >= 0 ? "text-emerald-400" : "text-gray-400"}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold">{r.label}{h.orderNumber ? ` · ${h.orderNumber}` : ""}</div>
                          <div className="text-[11px] text-gray-500 truncate">{new Date(h.createdAt).toLocaleString()}{h.note ? ` · ${h.note}` : ""}</div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${h.delta >= 0 ? "text-emerald-400" : "text-white"}`}>{h.delta >= 0 ? "+" : ""}{h.delta.toLocaleString()}</div>
                    </div>
                  )
                })}
              </NexusCard>
            )}
            {wallet.topups.filter((t) => t.status !== "active").length > 0 && (
              <div className="flex gap-2 flex-wrap pt-1">
                {wallet.topups.filter((t) => t.status !== "active").map((t) => <NexusBadge key={t.id} variant={t.status === "rejected" ? "warning" : "default"}>${Number(t.amountUsd).toFixed(0)} · {STATUS_LABEL[t.status] ?? t.status}</NexusBadge>)}
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
