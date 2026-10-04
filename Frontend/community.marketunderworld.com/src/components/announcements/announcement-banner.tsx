"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { getActiveAnnouncements, type ActiveAnnouncement } from "@/lib/api/staff"

const STYLE = {
  info: "bg-blue-950/90 border-blue-500/40 text-blue-100",
  warning: "bg-amber-950/90 border-amber-500/40 text-amber-100",
  critical: "bg-red-950/90 border-red-500/50 text-red-100",
} as const

// A dismissal is remembered per announcement id AND its text, so editing an announcement
// brings it back for people who had closed the old version.
const key = (a: ActiveAnnouncement) => `dismissed:${a.id}:${a.title.length}:${a.body.length}`

export function AnnouncementBanner() {
  const [items, setItems] = useState<ActiveAnnouncement[]>([])

  useEffect(() => {
    let alive = true
    getActiveAnnouncements().then((list) => {
      if (!alive) return
      const shown = list.filter((a) => {
        try { return !localStorage.getItem(key(a)) } catch { return true }
      })
      setItems(shown)
    })
    return () => { alive = false }
  }, [])

  if (items.length === 0) return null

  const dismiss = (a: ActiveAnnouncement) => {
    try { localStorage.setItem(key(a), "1") } catch { /* storage blocked: it just returns next visit */ }
    setItems((prev) => prev.filter((x) => x.id !== a.id))
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[1200] flex flex-col gap-1 p-2 pointer-events-none" role="region" aria-label="Announcements">
      {items.map((a) => (
        <div key={a.id} className={`pointer-events-auto mx-auto w-full max-w-3xl border rounded-lg px-4 py-2.5 text-sm flex items-start gap-3 backdrop-blur ${STYLE[a.severity]}`}>
          <div className="flex-1 min-w-0">
            <strong className="mr-2">{a.title}</strong>
            <span className="opacity-90">{a.body}</span>
            {a.linkUrl && (
              /^\//.test(a.linkUrl)
                ? <Link href={a.linkUrl} className="ml-2 underline font-semibold">Learn more</Link>
                : <a href={a.linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="ml-2 underline font-semibold">Learn more</a>
            )}
          </div>
          <button onClick={() => dismiss(a)} aria-label="Dismiss announcement" className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}
