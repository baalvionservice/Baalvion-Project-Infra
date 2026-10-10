"use client"

import React, { useEffect, useState } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { getPointsReceipts, type PointsReceipts } from '@/lib/api/points'

const usd = (points: number, perUsd: number) => `$${(points / perUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PointsReceiptsPage() {
  const [data, setData] = useState<PointsReceipts | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getPointsReceipts().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')) }, [])

  return (
    <div className="p-10 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Wallet Receipts</h1>
        <p className="text-text-muted font-medium max-w-3xl">What buyers have paid the marketplace with their wallet points: who paid (their member ID), for which order and product, and which seller it belongs to. Wallet loads are confirmed under Seller Payments.</p>
      </header>

      {error ? (
        <ListingCard className="p-12 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">{error}</ListingCard>
      ) : !data ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Loaded by buyers', v: data.totals.loaded },
              { label: 'Spent on orders', v: data.totals.spent },
              { label: 'Refunded to wallets', v: data.totals.refunded },
              { label: 'Still in wallets', v: data.totals.outstanding },
            ].map((t) => (
              <ListingCard key={t.label} className="p-5 border-brand-border bg-brand-surface">
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{t.label}</div>
                <div className="text-2xl font-bold text-white">{usd(t.v, data.pointsPerUsd)}</div>
                <div className="text-[11px] text-text-ghost">{t.v.toLocaleString()} points</div>
              </ListingCard>
            ))}
          </div>

          {data.receipts.length === 0 ? (
            <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
              <Coins className="w-10 h-10 text-text-ghost mx-auto mb-4" />
              <p className="text-text-muted font-medium">No purchases with points yet.</p>
            </ListingCard>
          ) : (
            <div className="space-y-3">
              {data.receipts.map((r) => (
                <ListingCard key={r.id} className="p-5 border-brand-border bg-brand-surface space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-white font-bold">{r.orderNumber}</span>
                    <Badge variant="default" className="text-[8px]">{r.points.toLocaleString()} pts · {usd(r.points, data.pointsPerUsd)}</Badge>
                    <Badge variant={r.paymentStatus === 'refunded' ? 'warning' : 'success'} className="text-[8px]">{r.paymentStatus === 'refunded' ? 'refunded' : r.orderStatus}</Badge>
                    <span className="text-[11px] text-text-ghost">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-text-muted">Paid by <span className="font-mono text-white">{r.buyerMemberNumber ?? 'unknown member'}</span></p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    {r.items.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-4">
                        <span>{i.name} × {i.quantity} <span className="text-text-ghost">· seller <span className="font-mono">{i.sellerMemberNumber ?? '—'}</span></span></span>
                        <span className="font-mono">${i.lineUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </li>
                    ))}
                  </ul>
                </ListingCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
