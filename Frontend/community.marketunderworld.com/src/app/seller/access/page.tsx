"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Loader2, Lock, MessageSquare, Send, Timer } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce'
import { listStoreCategories, type CommerceCategory } from '@/lib/api/commerce-admin'
import {
  getMyChat,
  listPaymentMethods,
  getWallet,
  listMyPayments,
  sendMyChatMessage,
  startAdminChat,
  startCategoryPayment,
  submitPaymentHash,
  type CategoryPayment,
  type PaymentMethod,
  type PaymentMethodInfo,
  type ChatMessage,
  type ChatSession,
  type SellerWallet,
} from '@/lib/api/seller-access'

const CATEGORY_PRICE_USD = 2000

const STATUS_LABEL: Record<CategoryPayment['status'], string> = {
  awaiting_payment: 'Awaiting your payment',
  payment_submitted: 'Waiting for admin to confirm',
  active: 'Active',
  rejected: 'Payment not found',
  forfeited: 'Access revoked',
}

function useCountdown(expiresAt: string | null) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) { setLeft(0); return }
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return left
}

export default function SellerAccessPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<CommerceCategory[]>([])
  const [payments, setPayments] = useState<CategoryPayment[]>([])
  const [wallet, setWallet] = useState<SellerWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [currency, setCurrency] = useState<PaymentMethod>('USDT')
  const [methods, setMethods] = useState<PaymentMethodInfo[]>([])
  const [network, setNetwork] = useState<string>('')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const fail = (title: string, err: unknown) =>
    toast({ variant: 'destructive', title, description: err instanceof Error ? err.message : 'Please try again.' })

  const refresh = useCallback(async () => {
    const [cats, pays, w] = await Promise.all([
      listStoreCategories(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
      listMyPayments().catch(() => []),
      getWallet().catch(() => null),
    ])
    setCategories(cats.filter((c) => !c.parentId))
    listPaymentMethods().then((m) => {
      setMethods(m)
      // Keep the choice on something that is actually switched on.
      setCurrency((cur) => (m.find((x) => x.method === cur && x.available) ? cur : (m.find((x) => x.available)?.method ?? cur)))
      setNetwork((cur) => {
        const usdt = m.find((x) => x.method === 'USDT')
        return usdt?.networks.find((n) => n.network === cur && n.available) ? cur : (usdt?.networks.find((n) => n.available)?.network ?? '')
      })
    }).catch(() => setMethods([]))
    setPayments(pays)
    setWallet(w)
  }, [])

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [refresh])

  const liveFor = (categoryId: string) =>
    payments.find((p) => p.categoryId === categoryId && ['awaiting_payment', 'payment_submitted', 'active'].includes(p.status))

  const begin = async (categoryId: string) => {
    setBusy(categoryId)
    try { await startCategoryPayment(categoryId, currency, currency === 'USDT' ? network : undefined); await refresh() } catch (e) { fail("Couldn't start payment", e) } finally { setBusy(null) }
  }

  const submitHash = async (paymentId: string) => {
    const txHash = (hashes[paymentId] || '').trim()
    if (txHash.length < 8) return toast({ variant: 'destructive', title: 'Enter the transaction hash' })
    setBusy(paymentId)
    try { await submitPaymentHash(paymentId, txHash); await refresh() } catch (e) { fail("Couldn't submit", e) } finally { setBusy(null) }
  }

  if (loading) {
    return <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  }

  return (
    <div className="max-w-[1000px] mx-auto px-10 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Access &amp; Tokens</h1>
        <p className="text-text-muted text-sm max-w-2xl">
          Selling in a category needs a one-time ${CATEGORY_PRICE_USD.toLocaleString()} payment in USDT, Bitcoin or Binance Pay. The payment is not refundable.
          It also credits tokens to your account — tokens can&apos;t be withdrawn and are only used to talk to the admin.
        </p>
      </header>

      <WalletPanel wallet={wallet} onChange={refresh} />

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white">Categories you can sell in</h2>
          <div className="flex gap-2">
            {methods.map((m) => (
              <button key={m.method} onClick={() => setCurrency(m.method)} disabled={!m.available}
                title={m.available ? undefined : "Not available right now"}
                className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${currency === m.method ? 'bg-brand-green text-black' : 'bg-brand-void border border-brand-border text-text-muted'}`}>
                Pay with {m.label}
              </button>
            ))}
          </div>
        </div>

        {currency === 'USDT' && (methods.find((m) => m.method === 'USDT')?.networks.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-text-muted uppercase tracking-widest font-bold">Network</span>
            {methods.find((m) => m.method === 'USDT')!.networks.map((n) => (
              <button key={n.network} onClick={() => setNetwork(n.network)} disabled={!n.available}
                className={`px-3 h-8 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${network === n.network ? 'bg-white text-black' : 'bg-brand-void border border-brand-border text-text-muted'}`}>
                {n.label}
              </button>
            ))}
            <span className="text-[11px] text-text-ghost">Pick the network you will send on. Sending on a different one loses the funds.</span>
          </div>
        )}

        {categories.length === 0 && (
          <ListingCard className="p-10 text-center border-brand-border bg-brand-surface text-text-muted text-sm">
            No categories are available yet. Your seller application must be approved first.
          </ListingCard>
        )}

        {categories.map((cat) => {
          const pay = liveFor(cat.id)
          return (
            <ListingCard key={cat.id} className="p-6 border-brand-border bg-brand-surface space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-white font-bold">{cat.name}</h3>
                  <p className="text-[11px] text-text-ghost">${CATEGORY_PRICE_USD.toLocaleString()} one-time · covers every sub-category</p>
                </div>
                {pay ? (
                  <Badge variant={pay.status === 'active' ? 'success' : 'default'} className="text-[8px]">{STATUS_LABEL[pay.status]}</Badge>
                ) : (
                  <AppButton onClick={() => begin(cat.id)} disabled={busy === cat.id}>
                    {busy === cat.id ? 'Starting…' : `Unlock for $${CATEGORY_PRICE_USD.toLocaleString()}`}
                  </AppButton>
                )}
              </div>

              {pay?.status === 'awaiting_payment' && pay.payTo && (
                <div className="space-y-3 p-4 rounded-lg bg-brand-void/60 border border-brand-border">
                  <p className="text-xs text-text-muted">
                    {pay.currency === 'BINANCE'
                      ? <>Pay <strong className="text-white">${CATEGORY_PRICE_USD.toLocaleString()}</strong> in USDT with Binance Pay to this Binance Pay ID:</>
                      : <>Send exactly <strong className="text-white">${CATEGORY_PRICE_USD.toLocaleString()}</strong> worth of {pay.payTo.label}{pay.payTo.networkLabel && pay.currency === 'USDT' ? <> on the <strong className="text-white">{pay.payTo.networkLabel}</strong> network</> : null} to:</>}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-brand-green break-all flex-1 select-all">{pay.payTo.address}</code>
                    <button aria-label="Copy address" onClick={() => navigator.clipboard?.writeText(pay.payTo!.address ?? '')} className="text-text-muted hover:text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {pay.payTo.recipient && <p className="text-[11px] text-text-muted">Recipient name shown by Binance: <strong className="text-white">{pay.payTo.recipient}</strong></p>}
                  {pay.payTo.address && <p className="text-[11px] text-text-ghost">Check the address ends in <strong className="text-white font-mono">{pay.payTo.address.slice(-6)}</strong> before you send. A wrong network or address cannot be recovered.</p>}
                  <p className="text-[11px] text-text-ghost">{pay.currency === 'BINANCE' ? 'Then paste the Binance Pay order or transaction ID below' : 'Then paste the transaction hash below'} so the admin can verify it.</p>
                  <div className="flex gap-2">
                    <input
                      value={hashes[pay.id] || ''}
                      onChange={(e) => setHashes((h) => ({ ...h, [pay.id]: e.target.value }))}
                      placeholder={pay.currency === 'BINANCE' ? "Binance Pay order / transaction ID" : "Transaction hash"}
                      className="flex-1 h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white"
                    />
                    <AppButton onClick={() => submitHash(pay.id)} disabled={busy === pay.id}>Submit</AppButton>
                  </div>
                </div>
              )}
              {pay?.status === 'payment_submitted' && <p className="text-xs text-text-muted">Hash submitted: <code>{pay.txHash}</code>. An admin will confirm it after checking the blockchain.</p>}
            </ListingCard>
          )
        })}

        {payments.filter((p) => p.status === 'rejected' || p.status === 'forfeited').map((p) => (
          <p key={p.id} className="text-[11px] text-semantic-error">{STATUS_LABEL[p.status]}{p.note ? ` — ${p.note}` : ''}</p>
        ))}
      </section>
    </div>
  )
}

function WalletPanel({ wallet, onChange }: { wallet: SellerWallet | null; onChange: () => Promise<void> }) {
  const { toast } = useToast()
  const [starting, setStarting] = useState(false)
  const session = wallet?.adminChat.activeSession ?? null
  const left = useCountdown(session?.expiresAt ?? null)

  useEffect(() => { if (session && left === 0) void onChange() }, [session, left, onChange])

  const start = async () => {
    setStarting(true)
    try { await startAdminChat(); await onChange() }
    catch (err) { toast({ variant: 'destructive', title: "Couldn't start chat", description: err instanceof Error ? err.message : 'Please try again.' }) }
    finally { setStarting(false) }
  }

  const live = session && left > 0
  return (
    <ListingCard className="p-6 border-brand-border bg-brand-surface space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold flex items-center gap-1.5"><Lock className="w-3 h-3" /> Tokens · not withdrawable</p>
          <p className="text-4xl font-bold text-white">{wallet?.balance ?? 0}</p>
        </div>
        {live ? (
          <Badge variant="success" className="text-[9px]"><Timer className="w-3 h-3 inline mr-1" />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left</Badge>
        ) : (
          <AppButton onClick={start} disabled={starting || (wallet?.balance ?? 0) < (wallet?.adminChat.costTokens ?? 5)}>
            <MessageSquare className="w-4 h-4 mr-2 inline" />
            {starting ? 'Starting…' : `Talk to admin · ${wallet?.adminChat.costTokens ?? 5} tokens / ${wallet?.adminChat.minutes ?? 5} min`}
          </AppButton>
        )}
      </div>
      {live && <ChatBox session={session!} />}
    </ListingCard>
  )
}

function ChatBox({ session }: { session: ChatSession }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastRef = useRef<string | undefined>(undefined)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stop = false
    const poll = async () => {
      try {
        const res = await getMyChat(lastRef.current)
        if (stop || !res.messages.length) return
        lastRef.current = res.messages[res.messages.length - 1].createdAt
        setMessages((m) => [...m, ...res.messages.filter((n) => !m.some((x) => x.id === n.id))])
      } catch { /* the next tick retries */ }
    }
    void poll()
    const id = setInterval(poll, 3000)
    return () => { stop = true; clearInterval(id) }
  }, [session.id])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setSending(true)
    try {
      const m = await sendMyChatMessage(body)
      setText('')
      lastRef.current = m.createdAt
      setMessages((prev) => [...prev, m])
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't send", description: err instanceof Error ? err.message : 'Please try again.' })
    } finally { setSending(false) }
  }

  return (
    <div className="border border-brand-border rounded-lg overflow-hidden">
      <div className="h-64 overflow-y-auto p-4 space-y-2 bg-black/40">
        {messages.length === 0 && <p className="text-xs text-text-ghost">Say hello — the admin will reply here.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderRole === 'seller' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${m.senderRole === 'seller' ? 'bg-brand-green text-black' : 'bg-white/10 text-white'}`}>{m.body}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-brand-border">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message"
          className="flex-1 h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
        <AppButton type="submit" disabled={sending || !text.trim()} aria-label="Send"><Send className="w-4 h-4" /></AppButton>
      </form>
    </div>
  )
}
