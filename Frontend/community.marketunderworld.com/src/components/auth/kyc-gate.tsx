"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { loadKycWindow, type KycWindow } from "@/lib/kyc-status"

const OPEN_PATHS = ["/", "/access-blocked", "/access-code", "/kyc", "/auth", "/support", "/contact", "/terms", "/privacy", "/onboarding", "/reset-password", "/forgot-password"]
const isOpen = (p: string) => OPEN_PATHS.some((o) => (o === "/" ? p === "/" : p === o || p.startsWith(o + "/")))

// Sends a member whose 7 days ran out to the "ask for access again" page, and nudges everyone else who still has days left.
export function KycGate() {
  const { isAuthenticated, isLoading } = useAuth()
  const path = usePathname() || "/"
  const router = useRouter()
  const [win, setWin] = useState<KycWindow | null>(null)

  useEffect(() => {
    if (isLoading || !isAuthenticated) { setWin(null); return }
    let live = true
    loadKycWindow().then((w) => {
      if (!live) return
      setWin(w)
      if (w?.state === "blocked" && !isOpen(path)) router.replace("/access-blocked")
    })
    return () => { live = false }
  }, [isAuthenticated, isLoading, path, router])

  if (win?.state !== "open" || isOpen(path) || path.startsWith("/admin")) return null
  const d = win.daysLeft ?? 0
  const urgent = d <= 2
  return (
    <div className={`fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pointer-events-none`}>
      <Link href="/kyc" className={`pointer-events-auto mx-auto max-w-xl flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${urgent ? "bg-red-950/95 border-red-500/60 text-red-100" : "bg-[#14141c]/95 border-white/15 text-gray-100"}`}>
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <span className="flex-1"><b>{d <= 0 ? "Last day" : `${d} ${d === 1 ? "day" : "days"} left`}</b> to verify your identity. After that your account is locked until you ask for access again.</span>
        <span className="font-semibold underline whitespace-nowrap">Verify now</span>
      </Link>
    </div>
  )
}
