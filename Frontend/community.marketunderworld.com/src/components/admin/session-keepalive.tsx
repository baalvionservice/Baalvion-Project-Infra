"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const EVERY_MS = 8 * 60_000
const AFTER_AWAY_MS = 4 * 60_000

// Keeps the admin signed in. The short access token is renewed in the background while an admin page is open, and as soon as
// the tab is opened again after being away, so nothing breaks because a tab sat idle. The admin only signs out by choosing to.
export function AdminSessionKeepAlive() {
  const last = useRef(Date.now())
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    let stopped = false
    const renew = async () => {
      if (stopped || (typeof navigator !== "undefined" && navigator.onLine === false)) return
      try {
        const res = await fetch("/auth-bff/auth/refresh", { method: "POST", credentials: "include", headers: { "content-type": "application/json" } })
        if (res.ok) { last.current = Date.now(); setEnded(false) }
        else if (res.status === 401) setEnded(true) // the refresh token itself is gone (signed out elsewhere, or revoked)
      } catch { /* offline or a blip: try again at the next tick */ }
    }
    const tick = setInterval(renew, EVERY_MS)
    const back = () => { if (document.visibilityState === "visible" && Date.now() - last.current > AFTER_AWAY_MS) renew() }
    document.addEventListener("visibilitychange", back)
    window.addEventListener("focus", back)
    window.addEventListener("online", renew)
    return () => { stopped = true; clearInterval(tick); document.removeEventListener("visibilitychange", back); window.removeEventListener("focus", back); window.removeEventListener("online", renew) }
  }, [])

  if (!ended) return null
  return (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10002] max-w-md w-[calc(100%-2rem)] rounded-xl border border-amber-500/40 bg-[#1a1408] text-amber-100 px-4 py-3 text-sm shadow-xl flex items-center gap-3">
      <span className="flex-1">This session was ended (you signed out on another device, or it was revoked). Sign in again to keep working.</span>
      <Link href="/auth/signin?redirect=/admin" className="shrink-0 font-semibold underline">Sign in</Link>
    </div>
  )
}
