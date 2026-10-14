"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle2, X } from "lucide-react"
import { PASS_REQUIRED_EVENT } from "@/lib/access-pass-event"

const PERKS = [
  "Post and reply in forums and live chat",
  "Book guest lists and VIP tables",
  "Apply to local listings and host nights",
  "Buy on the marketplace",
]

/** Opens when any request comes back "access pass required". Mounted once in the root layout. */
export function PassPrompt() {
  const [price, setPrice] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const cta = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const onNeed = (e: Event) => {
      const p = (e as CustomEvent<{ priceUsd?: number }>).detail?.priceUsd
      setPrice(typeof p === "number" ? p : 50)
      setOpen(true)
    }
    window.addEventListener(PASS_REQUIRED_EVENT, onNeed)
    return () => window.removeEventListener(PASS_REQUIRED_EVENT, onNeed)
  }, [])

  useEffect(() => {
    if (!open) return
    cta.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pass-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0B0C0F] p-6 sm:p-8 shadow-2xl"
      >
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#cc2200] mb-2">Members only</p>
        <h2 id="pass-title" className="text-2xl font-black text-white mb-2">One pass opens the room.</h2>
        <p className="text-sm text-gray-400 mb-5">Looking around is free. Posting, booking and applying are for members with the access pass.</p>
        <ul className="space-y-2.5 mb-6">
          {PERKS.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-sm text-gray-200">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#39FF14] shrink-0" /> {t}
            </li>
          ))}
        </ul>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-black text-white">${price}</span>
          <span className="text-sm text-gray-500">once. No subscription.</span>
        </div>
        <Link ref={cta} href="/buyer-pass" onClick={() => setOpen(false)} className="flex items-center justify-center h-12 rounded-lg bg-[#39FF14] text-black font-bold hover:bg-[#2BE010]">
          Get my access pass
        </Link>
        <button type="button" onClick={() => setOpen(false)} className="w-full mt-2 h-11 text-sm text-gray-500 hover:text-white">Not now</button>
        <p className="mt-3 text-[11px] leading-relaxed text-gray-600 text-center">Your pass switches on once our team confirms your payment.</p>
      </div>
    </div>
  )
}
