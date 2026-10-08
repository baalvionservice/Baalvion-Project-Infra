"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import { confirmPayment, listAllPayments, rejectPayment, revokePayment, type CategoryPayment } from '@/lib/api/seller-access'

const TABS: { label: string; value: CategoryPayment['status'] }[] = [
  { label: 'To confirm', value: 'payment_submitted' },
  { label: 'Awaiting payment', value: 'awaiting_payment' },
  { label: 'Active', value: 'active' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revoked', value: 'forfeited' },
]

type Action = { id: string; kind: 'confirm' | 'reject' | 'revoke' }

export default function SellerPaymentsPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<CategoryPayment['status']>('payment_submitted')
  const [items, setItems] = useState<CategoryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [field, setField] = useState('')
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
      if (action.kind === 'confirm') await confirmPayment(action.id, field.trim())
      else if (action.kind === 'reject') await rejectPayment(action.id, field.trim())
      else await revokePayment(action.id, field.trim())
      toast({ title: action.kind === 'confirm' ? 'Payment confirmed — tokens credited' : action.kind === 'reject' ? 'Payment rejected' : 'Access revoked' })
      setAction(null); setField(''); load(status)
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
                <h3 className="text-white font-bold">{p.sellerName || `Seller #${p.sellerUserId}`}{p.storeName ? <span className="text-text-muted font-normal"> · {p.storeName}</span> : null}</h3>
                {p.memberNumber && <span className="font-mono text-[10px] text-text-ghost">{p.memberNumber}</span>}
                <Badge variant="default" className="text-[8px]">${p.amountUsd} · {p.currency}</Badge>
                <span className="text-[10px] text-text-ghost font-mono">{p.categoryName || `Category ${p.categoryId.slice(0, 8)}`} · {new Date(p.createdAt).toLocaleString()}</span>
              </div>
              {p.txHash && <p className="text-xs text-text-muted break-all">Hash: <code className="text-white">{p.txHash}</code></p>}
              {p.amountReceived && <p className="text-xs text-text-muted">Received: {p.amountReceived}</p>}
              {p.note && <p className="text-xs text-text-ghost">Note: {p.note}</p>}

              {action?.id === p.id ? (
                <div className="flex gap-2 flex-wrap">
                  <input autoFocus value={field} onChange={(e) => setField(e.target.value)}
                    placeholder={action.kind === 'confirm' ? 'Amount received (e.g. 2000 USDT)' : 'Reason'}
                    className="flex-1 min-w-[240px] h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
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
