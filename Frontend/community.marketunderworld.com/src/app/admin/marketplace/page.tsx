"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { listAllProducts, setProductLive, type AdminProductQueueItem } from "@/lib/api/commerce-admin"

const STATUSES = [
  { id: "", label: "All" },
  { id: "published", label: "Live" },
  { id: "archived", label: "Hidden" },
  { id: "pending_review", label: "Waiting for review" },
  { id: "draft", label: "Drafts" },
]

const STATUS_LABEL: Record<string, string> = {
  published: "Live", archived: "Hidden", pending_review: "Waiting for review", draft: "Draft", rejected: "Rejected", approved: "Approved",
}

const priceOf = (p: AdminProductQueueItem) => {
  const v = p.variants?.find((x) => x.isDefault) ?? p.variants?.[0]
  return v ? `${Number(v.price).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${v.currencyCode}` : "No price"
}

export default function ListingOversightPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<AdminProductQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback((q = search) => {
    setLoading(true)
    listAllProducts({ status: status || undefined, search: q || undefined, limit: 100 })
      .then((res) => setItems(res.items))
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load listings", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false))
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const toggle = async (p: AdminProductQueueItem) => {
    const goLive = p.status !== "published"
    setBusyId(p.id)
    try {
      await setProductLive(p.storeId, p.id, goLive)
      toast({ title: goLive ? `${p.name} is live` : `${p.name} is hidden` })
      load()
    } catch (err) {
      toast({ variant: "destructive", title: goLive ? "Couldn't make it live" : "Couldn't hide it", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-10 pb-32 max-w-[1200px] mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Listing Oversight</h1>
          <p className="text-sm text-gray-500 mt-1">Every listing in one place. Hide one without deleting it, and bring it back any time.</p>
        </div>
        <Link href="/seller/listings/new"><NexusButton className="gap-2"><Plus className="w-4 h-4" /> Add a listing</NexusButton></Link>
      </header>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s.id} onClick={() => setStatus(s.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${status === s.id ? "bg-white/10 border-white/20 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(search) }} className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings…" aria-label="Search listings"
            className="h-10 w-full md:w-72 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30" />
        </form>
      </div>

      {loading ? (
        <p className="text-gray-500 py-16 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <NexusCard className="p-10 text-center text-gray-500 bg-white/[0.02] border-white/5">No listings match.</NexusCard>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const canSwitch = p.status === "published" || p.status === "archived"
            return (
              <NexusCard key={p.id} className="p-5 bg-white/[0.02] border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <NexusBadge variant={p.status === "published" ? "success" : "default"}>{STATUS_LABEL[p.status] ?? p.status}</NexusBadge>
                      <span className="text-xs text-gray-500">{priceOf(p)}</span>
                      <span className="text-xs text-gray-500">· {p.stockQuantity} in stock</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canSwitch ? (
                      <button
                        role="switch" aria-checked={p.status === "published"} aria-label={p.status === "published" ? `Hide ${p.name}` : `Make ${p.name} live`}
                        disabled={busyId === p.id} onClick={() => toggle(p)}
                        className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${p.status === "published" ? "bg-emerald-500" : "bg-white/15"}`}>
                        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${p.status === "published" ? "left-7" : "left-1"}`} />
                      </button>
                    ) : (
                      <Link href="/admin/moderation" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Open review queue</Link>
                    )}
                    <span className="text-[11px] font-bold text-gray-500 w-10">{p.status === "published" ? "On" : canSwitch ? "Off" : ""}</span>
                  </div>
                </div>
              </NexusCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
