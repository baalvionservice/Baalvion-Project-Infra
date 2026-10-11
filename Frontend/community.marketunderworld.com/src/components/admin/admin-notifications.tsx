"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bell, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { fetchAdminNotices, type AdminNotice } from "@/lib/api/admin-notifications"

const EVERY_MS = 60_000

type NoticeState = { items: AdminNotice[] | null; total: number; updated: Date | null; busy: boolean; reload: () => Promise<void> }
const Ctx = createContext<NoticeState>({ items: null, total: 0, updated: null, busy: false, reload: async () => {} })

// One shared poll for the bell and the dashboard list.
export const useAdminNotices = () => useContext(Ctx)

export function AdminNoticesProvider({ children }: { children: React.ReactNode }) {
  const value = usePoll()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function usePoll(): NoticeState {
  const [items, setItems] = useState<AdminNotice[] | null>(null)
  const [updated, setUpdated] = useState<Date | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    setBusy(true)
    const next = await fetchAdminNotices()
    setItems(next); setUpdated(new Date()); setBusy(false)
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, EVERY_MS)
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus) }
  }, [load])
  const total = (items ?? []).reduce((s, i) => s + i.count, 0)
  useEffect(() => {
    const base = "Hell Road Admin"
    document.title = total > 0 ? `(${total}) ${base}` : base
  }, [total])
  return { items, total, updated, busy, reload: load }
}

export function NoticeList({ items, onNavigate }: { items: AdminNotice[]; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-white/5">
      {items.map((i) => (
        <li key={i.key}>
          <Link href={i.href} onClick={onNavigate} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 group">
            <span className={`shrink-0 min-w-[2rem] h-8 px-2 rounded-lg flex items-center justify-center text-sm font-bold ${i.urgent ? "bg-red-600 text-white" : "bg-white/10 text-white"}`}>{i.count}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-white">{i.text}</span>
              <span className="block text-xs text-gray-500">{i.cta}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

// The bell in the admin top bar: a number for what is waiting and a list that says what each thing is and where to act.
export function AdminNotificationBell() {
  const state = useAdminNotices()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc) }
  }, [])
  const { items, total, updated, busy, reload } = state

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-haspopup="dialog" aria-expanded={open} aria-label={total > 0 ? `${total} things are waiting for you` : "Notifications"}
        className="relative p-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5" />
        {total > 0 && <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#070710]">{total > 99 ? "99+" : total}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="What is waiting for you" className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] rounded-xl border border-white/10 bg-[#0B0C0F] shadow-2xl z-[1200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">{total > 0 ? `${total} waiting for you` : "Nothing is waiting"}</p>
              <p className="text-xs text-gray-500">{updated ? `Updated ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading…"}</p>
            </div>
            <button onClick={reload} aria-label="Refresh" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {items === null ? (
              <div className="p-6 flex items-center justify-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />You are all caught up. Payments, approvals and help tickets will show here.</div>
            ) : <NoticeList items={items} onNavigate={() => setOpen(false)} />}
          </div>
        </div>
      )}
    </div>
  )
}
