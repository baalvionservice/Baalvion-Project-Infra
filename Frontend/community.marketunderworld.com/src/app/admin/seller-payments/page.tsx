"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Clock, Image as ImageIcon, Loader2, Wallet } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import { confirmPayment, getReviewWait, listAllPayments, listPaymentProofs, rejectPayment, revokePayment, setReviewWait, type CategoryPayment, type PaymentProof } from '@/lib/api/seller-access'

const TABS: { label: string; value: CategoryPayment['status'] }[] = [
  { label: 'To confirm', value: 'payment_submitted' },
  { label: 'Awaiting payment', value: 'awaiting_payment' },
  { label: 'Active', value: 'active' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revoked', value: 'forfeited' },
]

type Action = { id: string; kind: 'confirm' | 'reject' | 'revoke' }

// How long an admin takes to check a payment (5 to 30 minutes). Payers see this number and a countdown.
function ReviewWaitSetting() {
  const { toast } = useToast()
  const [minutes, setMinutes] = useState<number | null>(null)
  const [range, setRange] = useState({ min: 5, max: 30 })
  const [saving, setSaving] = useState(false)
  useEffect(() => { getReviewWait().then((r) => { setMinutes(r.reviewWaitMinutes); setRange({ min: r.min, max: r.max }) }).catch(() => {}) }, [])
  if (minutes === null) return null
  const save = async (m: number) => {
    setSaving(true)
    try { await setReviewWait(m); setMinutes(m); toast({ title: `Review time set to ${m} minutes`, description: 'Payers now see this on their payment screens.' }) }
    catch (e) { toast({ variant: 'destructive', title: "Couldn't save", description: e instanceof Error ? e.message : 'Please try again.' }) }
    finally { setSaving(false) }
  }
  const options: number[] = []
  for (let m = range.min; m <= range.max; m += 5) options.push(m)
  return (
    <ListingCard className="p-5 border-brand-border bg-brand-surface flex items-center gap-4 flex-wrap">
      <Clock className="w-5 h-5 text-text-muted" />
      <div className="flex-1 min-w-[240px]">
        <p className="text-sm font-bold text-white">Review time shown to payers</p>
        <p className="text-xs text-text-muted">How long you take to check a payment. Each new payment keeps the time that was showing when it was sent.</p>
      </div>
      <div className="flex gap-2">
        {options.map((m) => (
          <button key={m} disabled={saving} onClick={() => save(m)}
            className={`px-4 h-9 rounded-lg text-xs font-bold ${minutes === m ? 'bg-brand-green text-black' : 'bg-brand-void border border-brand-border text-text-muted hover:text-white'}`}>{m} min</button>
        ))}
      </div>
    </ListingCard>
  )
}

// The screenshots a payer attached, loaded when the admin opens them.
function Proofs({ id, count }: { id: string; count: number }) {
  const [open, setOpen] = useState(false)
  const [proofs, setProofs] = useState<PaymentProof[] | null>(null)
  const [big, setBig] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  if (!count) return <p className="text-xs text-text-ghost">No screenshot attached.</p>
  const toggle = () => {
    setOpen((o) => !o)
    if (!proofs) listPaymentProofs(id).then(setProofs).catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'))
  }
  return (
    <div className="space-y-2">
      <button onClick={toggle} className="inline-flex items-center gap-1.5 text-xs text-brand-green hover:underline"><ImageIcon className="w-3.5 h-3.5" /> {open ? 'Hide' : 'View'} {count} screenshot{count > 1 ? 's' : ''}</button>
      {open && (err ? <p className="text-xs text-semantic-error">{err}</p> : !proofs ? <Loader2 className="w-4 h-4 animate-spin text-text-muted" /> : (
        <div className="flex gap-3 flex-wrap">
          {proofs.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.dataUrl} alt="Payment screenshot" onClick={() => setBig(p.dataUrl)} className="h-40 rounded-lg border border-brand-border cursor-zoom-in" />
          ))}
        </div>
      ))}
      {big && (
        <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big} alt="Payment screenshot, full size" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

// "Sent 12 min ago" with how it compares to the review time payers were shown.
const waiting = (p: CategoryPayment) => {
  const sent = p.submittedAt ? new Date(p.submittedAt) : null
  if (!sent || p.status !== 'payment_submitted') return null
  const mins = Math.max(0, Math.round((Date.now() - sent.getTime()) / 60000))
  const limit = p.reviewWaitMinutes || 15
  return { mins, late: mins > limit, limit }
}

export default function SellerPaymentsPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<CategoryPayment['status']>('payment_submitted')
  const [items, setItems] = useState<CategoryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [field, setField] = useState('')
  const [credit, setCredit] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback((s: CategoryPayment['status']) => {
    setLoading(true); setError(null)
    listAllPayments(s).then(setItems).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load(status) }, [status, load])

  const run = async () => {
    if (!action || !field.trim()) return
    setBusy(true)
    try {
      if (action.kind === 'confirm') await confirmPayment(action.id, field.trim(), undefined, credit ? Number(credit) : undefined)
      else if (action.kind === 'reject') await rejectPayment(action.id, field.trim())
      else await revokePayment(action.id, field.trim())
      toast({ title: action.kind === 'confirm' ? (items.find((i) => i.id === action.id)?.kind === 'wallet_topup' ? 'Payment confirmed — points credited' : 'Payment confirmed') : action.kind === 'reject' ? 'Payment rejected' : 'Access revoked' })
      setAction(null); setField(''); setCredit(''); load(status)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed', description: e instanceof Error ? e.message : 'Please try again.' })
    } finally { setBusy(false) }
  }

  return (
    <div className="p-10 space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Seller Payments</h1>
        <p className="text-text-muted font-medium">Check each transaction on the blockchain, then confirm it. Confirming unlocks the category and credits the seller&apos;s tokens.</p>
      </header>

      <ReviewWaitSetting />

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-5 h-10 rounded-lg text-xs font-bold uppercase tracking-widest ${status === t.value ? 'bg-brand-green text-black' : 'bg-brand-void border border-brand-border text-text-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">{error}</ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <Wallet className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">Nothing here.</p>
        </ListingCard>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <ListingCard key={p.id} className="p-6 border-brand-border bg-brand-surface space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-white font-bold">{p.sellerName || `${p.kind === 'category' ? 'Seller' : 'Buyer'} #${p.sellerUserId}`}{p.storeName ? <span className="text-text-muted font-normal"> · {p.storeName}</span> : null}</h3>
                {p.memberNumber && <span className="font-mono text-[10px] text-text-ghost">{p.memberNumber}</span>}
                <Badge variant="default" className="text-[8px]">${p.amountUsd} · {p.currency}</Badge>
                <span className="text-[10px] text-text-ghost font-mono">{p.kind === 'buyer_access' ? 'Buyer access pass' : p.kind === 'wallet_topup' ? `Wallet load → ${Math.round(Number(p.amountUsd) * 100).toLocaleString()} points` : (p.categoryName || `Category ${(p.categoryId ?? '').slice(0, 8)}`)} · {new Date(p.createdAt).toLocaleString()}</span>
              </div>
              {(() => { const w = waiting(p); return w ? <p className={`text-xs font-bold ${w.late ? 'text-semantic-error' : 'text-text-muted'}`}>Sent {w.mins} min ago · payer was told {w.limit} min{w.late ? ' — over time, please review' : ''}</p> : null })()}
              {p.status === 'payment_submitted' && <Proofs id={p.id} count={p.proofCount || 0} />}
              {p.txHash && <p className="text-xs text-text-muted break-all">Hash: <code className="text-white">{p.txHash}</code></p>}
              {p.amountReceived && <p className="text-xs text-text-muted">Received: {p.amountReceived}</p>}
              {p.note && <p className="text-xs text-text-ghost">Note: {p.note}</p>}

              {action?.id === p.id ? (
                <div className="flex gap-2 flex-wrap">
                  <input autoFocus value={field} onChange={(e) => setField(e.target.value)}
                    placeholder={action.kind === 'confirm' ? 'Amount received (e.g. 2000 USDT)' : 'Reason'}
                    className="flex-1 min-w-[240px] h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
                  {action.kind === 'confirm' && p.kind === 'wallet_topup' && (
                    <input value={credit} onChange={(e) => setCredit(e.target.value)} type="number" min={0} step="0.01" placeholder={`Credit in USD (blank = $${Number(p.amountUsd).toFixed(2)})`}
                      aria-label="Credit in USD" className="w-64 h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
                  )}
                  <AppButton onClick={run} disabled={busy || !field.trim()}>{busy ? 'Saving…' : 'Confirm'}</AppButton>
                  <AppButton variant="secondary" onClick={() => { setAction(null); setField('') }}>Cancel</AppButton>
                </div>
              ) : (
                <div className="flex gap-2">
                  {p.status === 'payment_submitted' && (<>
                    <AppButton onClick={() => setAction({ id: p.id, kind: 'confirm' })}>Confirm payment</AppButton>
                    <AppButton variant="secondary" onClick={() => setAction({ id: p.id, kind: 'reject' })}>Reject</AppButton>
                  </>)}
                  {p.status === 'active' && <AppButton variant="secondary" onClick={() => setAction({ id: p.id, kind: 'revoke' })}>Revoke access</AppButton>}
                </div>
              )}
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  )
}
