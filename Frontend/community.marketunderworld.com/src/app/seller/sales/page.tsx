"use client"

import React, { useEffect, useState } from 'react'
import { Loader2, Star, UserRound } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce'
import { addSaleShipment, listMySales, rateBuyer, setSaleStatus, type SellerSale } from '@/lib/api/orders'

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onPick} onClick={() => onPick?.(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={onPick ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-4 h-4 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-text-ghost'}`} />
        </button>
      ))}
    </span>
  )
}

export default function SellerSalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<SellerSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { rating: number; comment: string }>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () =>
    listMySales(MARKET_UNDERWORLD_STORE_ID).then(setSales)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sales')).finally(() => setLoading(false))
  useEffect(() => { void load() }, [])

  const [tracking, setTracking] = useState<Record<string, { carrier: string; trackingNumber: string }>>({})

  const act = async (sale: SellerSale, run: () => Promise<void>, done: string) => {
    setBusyId(sale.id)
    try { await run(); toast({ title: done }); await load() }
    catch (e) { toast({ variant: 'destructive', title: "Couldn't update the order", description: e instanceof Error ? e.message : 'Please try again.' }) }
    finally { setBusyId(null) }
  }

  const NEXT: Partial<Record<SellerSale['status'], 'confirmed' | 'processing' | 'shipped' | 'delivered'>> = {
    pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered',
  }

  const submit = async (sale: SellerSale) => {
    const d = draft[sale.id]
    if (!d?.rating) return toast({ variant: 'destructive', title: 'Pick a star rating first' })
    setBusyId(sale.id)
    try {
      await rateBuyer(MARKET_UNDERWORLD_STORE_ID, sale.id, d.rating, d.comment.trim())
      toast({ title: 'Buyer rated' })
      await load()
    } catch (e) {
      toast({ variant: 'destructive', title: "Couldn't save rating", description: e instanceof Error ? e.message : 'Please try again.' })
    } finally { setBusyId(null) }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-10 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Buyers &amp; Sales</h1>
        <p className="text-text-muted text-sm max-w-2xl">
          Orders containing your products, with the buyer&apos;s details for fulfilment. Once an order is delivered and paid you can rate the buyer.
          Other sellers&apos; items on the same order are not shown.
        </p>
      </header>

      {error ? (
        <ListingCard className="p-10 text-center border-brand-border bg-brand-surface text-semantic-error">{error}</ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : sales.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-text-muted text-sm">No sales yet.</ListingCard>
      ) : sales.map((sale) => {
        const ship = sale.shippingAddress
        const d = draft[sale.id] ?? { rating: 0, comment: '' }
        return (
          <ListingCard key={sale.id} className="p-6 border-brand-border bg-brand-surface space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-white font-bold">#{sale.orderNumber}</h3>
              <Badge variant={sale.status === 'delivered' ? 'success' : 'default'} className="text-[8px]">{sale.status}</Badge>
              <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-[8px]">{sale.paymentStatus}</Badge>
              <span className="text-[10px] text-text-ghost">{new Date(sale.createdAt).toLocaleString()}</span>
            </div>

            <ul className="text-sm text-gray-300 space-y-1">
              {sale.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4"><span>{i.name} × {i.quantity}</span><span>{sale.currencyCode} {Number(i.price) * i.quantity}</span></li>
              ))}
            </ul>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-brand-void/60 border border-brand-border space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold flex items-center gap-1.5"><UserRound className="w-3 h-3" /> Buyer</p>
                <p className="text-white font-bold">{sale.buyer.name || 'Unnamed buyer'}</p>
                {sale.buyer.memberNumber && <p className="font-mono text-[11px] text-gray-500">{sale.buyer.memberNumber}</p>}
                {sale.buyer.email && <p className="text-xs text-text-muted">{sale.buyer.email}</p>}
                {sale.buyer.phone && <p className="text-xs text-text-muted">{sale.buyer.phone}</p>}
                <div className="flex items-center gap-2 pt-1">
                  {sale.buyer.ratingCount > 0 ? (<><Stars value={sale.buyer.ratingAverage ?? 0} /><span className="text-[11px] text-text-muted">{sale.buyer.ratingAverage?.toFixed(1)} ({sale.buyer.ratingCount})</span></>) : <span className="text-[11px] text-text-ghost">No seller ratings yet</span>}
                </div>
                <p className="text-[11px] text-text-ghost">{sale.buyer.paidOrders} paid order{sale.buyer.paidOrders === 1 ? '' : 's'}</p>
              </div>
              <div className="p-4 rounded-lg bg-brand-void/60 border border-brand-border space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Ship to</p>
                {ship && (ship.address1 || ship.city) ? (
                  <p className="text-xs text-gray-300 whitespace-pre-line">
                    {[`${ship.firstName ?? ''} ${ship.lastName ?? ''}`.trim(), ship.address1, ship.address2, [ship.city, ship.state, ship.zip].filter(Boolean).join(', '), ship.countryCode, ship.phone].filter(Boolean).join('\n')}
                  </p>
                ) : <p className="text-xs text-text-ghost">No shipping address on this order.</p>}
              </div>
            </div>

            {sale.paymentStatus === 'paid' && NEXT[sale.status] && (
              <div className="space-y-3 p-4 rounded-lg bg-brand-void/60 border border-brand-border">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Fulfilment</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <input value={tracking[sale.id]?.carrier ?? ''} onChange={(e) => setTracking((p) => ({ ...p, [sale.id]: { carrier: e.target.value, trackingNumber: p[sale.id]?.trackingNumber ?? '' } }))}
                    placeholder="Carrier" className="h-9 w-36 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
                  <input value={tracking[sale.id]?.trackingNumber ?? ''} onChange={(e) => setTracking((p) => ({ ...p, [sale.id]: { carrier: p[sale.id]?.carrier ?? '', trackingNumber: e.target.value } }))}
                    placeholder="Tracking number" className="h-9 flex-1 min-w-[160px] px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
                  <AppButton variant="secondary" disabled={busyId === sale.id || !(tracking[sale.id]?.carrier && tracking[sale.id]?.trackingNumber)}
                    onClick={() => act(sale, () => addSaleShipment(MARKET_UNDERWORLD_STORE_ID, sale.id, tracking[sale.id]), 'Tracking added')}>Add tracking</AppButton>
                </div>
                {sale.soleSeller ? (
                  <AppButton disabled={busyId === sale.id} onClick={() => act(sale, () => setSaleStatus(MARKET_UNDERWORLD_STORE_ID, sale.id, NEXT[sale.status]!), `Marked ${NEXT[sale.status]}`)}>
                    Mark as {NEXT[sale.status]}
                  </AppButton>
                ) : (
                  <p className="text-[11px] text-text-ghost">This order also has another seller&apos;s items, so an admin updates its status. You can still add your tracking.</p>
                )}
              </div>
            )}

            {sale.myRating ? (
              <div className="flex items-center gap-2 text-xs text-text-muted"><span>Your rating of this buyer:</span><Stars value={sale.myRating.rating} />{sale.myRating.comment && <span>— {sale.myRating.comment}</span>}</div>
            ) : sale.canRateBuyer ? (
              <div className="space-y-3">
                <p className="text-xs text-text-muted font-bold">Rate this buyer</p>
                <Stars value={d.rating} onPick={(n) => setDraft((p) => ({ ...p, [sale.id]: { ...d, rating: n } }))} />
                <textarea value={d.comment} maxLength={1000} onChange={(e) => setDraft((p) => ({ ...p, [sale.id]: { ...d, comment: e.target.value } }))}
                  placeholder="Optional note — payment speed, communication…" rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-brand-border text-sm text-white" />
                <AppButton onClick={() => submit(sale)} disabled={busyId === sale.id || !d.rating}>{busyId === sale.id ? 'Saving…' : 'Submit rating'}</AppButton>
              </div>
            ) : (
              <p className="text-[11px] text-text-ghost">You can rate this buyer once the order is delivered and paid.</p>
            )}
          </ListingCard>
        )
      })}
    </div>
  )
}
