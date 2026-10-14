"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Megaphone, X } from "lucide-react"
import { getActiveAnnouncements, type ActiveAnnouncement } from "@/lib/api/staff"
import { isSellerNotice, stripSellerTag } from "@/lib/seller-notice"

const STYLE = {
  info: "bg-cyan-950/60 border-cyan-500/30 text-cyan-50",
  warning: "bg-amber-950/60 border-amber-500/40 text-amber-50",
  critical: "bg-red-950/60 border-red-500/40 text-red-50",
} as const

// Closing a notice hides it on this browser only; editing it (or switching it on again) shows it again.
const key = (a: ActiveAnnouncement) => `seller-notice:${a.id}:${a.title.length}:${a.body.length}`

export function SellerNotice({ bare = false }: { bare?: boolean }) {
  const [notice, setNotice] = useState<ActiveAnnouncement | null>(null)

  useEffect(() => {
    let alive = true
    getActiveAnnouncements().then((list) => {
      if (!alive) return
      const mine = list.find((a) => isSellerNotice(a.title))
      if (!mine) return setNotice(null)
      try { if (localStorage.getItem(key(mine))) return setNotice(null) } catch { /* storage blocked: show it */ }
      setNotice(mine)
    })
    return () => { alive = false }
  }, [])

  if (!notice) return null

  const close = () => {
    try { localStorage.setItem(key(notice), "1") } catch { /* it returns next visit */ }
    setNotice(null)
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => bare ? <>{children}</> : <div className="max-w-[1200px] mx-auto px-3 sm:px-6 mt-4">{children}</div>
  return (
    <Wrap>
    <div role="status" className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${STYLE[notice.severity]}`}>
      <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 text-sm">
        <strong className="mr-2">{stripSellerTag(notice.title)}</strong>
        <span className="opacity-90">{notice.body}</span>
        {notice.linkUrl && (/^\//.test(notice.linkUrl)
          ? <Link href={notice.linkUrl} className="ml-2 underline font-semibold">Details</Link>
          : <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="ml-2 underline font-semibold">Details</a>)}
      </div>
      <button onClick={close} aria-label="Close notice" className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
    </Wrap>
  )
}
