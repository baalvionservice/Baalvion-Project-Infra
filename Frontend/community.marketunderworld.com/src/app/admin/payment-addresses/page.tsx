"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, ShieldAlert, Wallet } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import {
  destinationHistory,
  listDestinations,
  saveDestination,
  type PaymentDestination,
  type PaymentDestinationEntry,
  type PaymentDestinationChange,
} from '@/lib/api/seller-access'

const short = (a: string | null) => (a ? (a.length > 20 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a) : '—')

export default function PaymentAddressesPage() {
  const [items, setItems] = useState<PaymentDestination[]>([])
  const [history, setHistory] = useState<PaymentDestinationChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([listDestinations(), destinationHistory().catch(() => [])])
      .then(([d, h]) => { setItems(d); setHistory(h); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div className="p-10 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Payment Addresses</h1>
        <p className="text-text-muted font-medium max-w-3xl">Where sellers send the $2,000 category payment. Each seller is shown the address that was active when they started paying, so changing one never affects a payment already in progress.</p>
      </header>

      <ListingCard className="p-4 border-amber-500/30 bg-amber-500/5 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-100/90">Only a super admin can change these. Every change is recorded with who made it. Addresses are checked for typos, but always send a small test payment before announcing a new address.</p>
      </ListingCard>

      {error ? (
        <ListingCard className="p-12 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">{error}</ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="space-y-6">{items.map((d) => <DestinationCard key={d.method} d={d} onSaved={load} />)}</div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Change history</h2>
            {history.length === 0 ? <p className="text-sm text-text-muted">No changes yet.</p> : (
              <ListingCard className="border-brand-border bg-brand-surface divide-y divide-brand-border">
                {history.map((h, i) => (
                  <div key={i} className="p-4 text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-white font-bold">{h.method}</span>
                    <span>{h.action}</span>
                    <span className="font-mono">{h.network ? `${h.network} · ` : ''}{short(h.oldAddress)} → {short(h.newAddress)}</span>
                    <span>by admin #{h.changedBy ?? '?'}</span>
                    <span className="text-text-ghost">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </ListingCard>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function DestinationCard({ d, onSaved }: { d: PaymentDestination; onSaved: () => void }) {
  const anyLive = d.entries.some((e) => e.configured && e.isActive)
  return (
    <ListingCard className="p-6 border-brand-border bg-brand-surface space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Wallet className="w-5 h-5 text-brand-green" />
        <h3 className="text-lg font-bold text-white">{d.label}</h3>
        <Badge variant={anyLive ? 'success' : 'warning'} className="text-[8px]">{anyLive ? 'live' : 'not set'}</Badge>
      </div>
      <div className="space-y-6 divide-y divide-brand-border">
        {d.entries.map((e) => <EntryEditor key={e.network || 'default'} d={d} e={e} onSaved={onSaved} />)}
      </div>
    </ListingCard>
  )
}

function EntryEditor({ d, e, onSaved }: { d: PaymentDestination; e: PaymentDestinationEntry; onSaved: () => void }) {
  const { toast } = useToast()
  const [address, setAddress] = useState('')
  const [confirm, setConfirm] = useState('')
  const [label, setLabel] = useState(e.label ?? '')
  const [active, setActive] = useState(e.isActive)
  const [saving, setSaving] = useState(false)
  const name = e.networkLabel ? `${d.label} · ${e.networkLabel}` : d.label

  const save = async () => {
    setSaving(true)
    try {
      await saveDestination(d.method, { address, confirmAddress: confirm, network: e.network || null, label: d.method === 'BINANCE' ? label : null, isActive: active })
      toast({ title: `${name} saved` })
      setAddress(''); setConfirm(''); onSaved()
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't save", description: err instanceof Error ? err.message : 'Please try again.' })
    } finally { setSaving(false) }
  }

  return (
    <div className="pt-5 first:pt-0 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {e.networkLabel && <span className="text-sm font-bold text-white">{e.networkLabel}</span>}
        {e.configured
          ? <Badge variant={e.isActive ? 'success' : 'warning'} className="text-[8px]">{e.isActive ? 'live' : 'switched off'}</Badge>
          : <Badge variant="default" className="text-[8px]">not set</Badge>}
        {e.source === 'env' && <Badge variant="default" className="text-[8px]">from server settings</Badge>}
      </div>
      <div className="text-sm">
        <span className="text-text-muted">Current: </span>
        {e.address ? <code className="text-brand-green break-all select-all">{e.address}</code> : <span className="text-text-ghost">none — sellers cannot pay this way</span>}
        {e.label && <span className="text-text-muted"> · recipient “{e.label}”</span>}
        {e.updatedAt && <div className="text-[11px] text-text-ghost mt-1">Last changed {new Date(e.updatedAt).toLocaleString()} by admin #{e.updatedBy ?? '?'}</div>}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={address} onChange={(ev) => setAddress(ev.target.value)} placeholder={`New ${d.idLabel}`} aria-label={`New ${name} address`} autoComplete="off" spellCheck={false}
          className="h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white font-mono" />
        <input value={confirm} onChange={(ev) => setConfirm(ev.target.value)} placeholder="Type it again to confirm" aria-label={`Confirm ${name} address`} autoComplete="off" spellCheck={false}
          className="h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white font-mono" />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {d.method === 'BINANCE' && (
          <input value={label} onChange={(ev) => setLabel(ev.target.value)} maxLength={80} placeholder="Recipient name shown by Binance" aria-label="Recipient name"
            className="h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white w-64" />
        )}
        <label className="flex items-center gap-2 text-sm text-text-muted"><input type="checkbox" checked={active} onChange={(ev) => setActive(ev.target.checked)} className="accent-[#39FF14]" /> Accept payments this way</label>
        <AppButton onClick={save} disabled={saving || !address || !confirm}>{saving ? 'Saving…' : e.configured ? 'Replace address' : 'Save address'}</AppButton>
      </div>
    </div>
  )
}
