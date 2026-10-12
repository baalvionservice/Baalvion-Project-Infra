"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"

const TILES = [
  { title: "Forum communities", text: "Join open forums or ask to enter private ones.", href: "/forum/join" },
  { title: "Buy in the marketplace", text: "Get a buyer pass to shop and pay.", href: "/buyer-pass" },
  { title: "Sell on Hell Road", text: "Apply as a seller. One page, reviewed by the team.", href: "/seller/onboarding" },
  { title: "Be a trusted middleman", text: "Hold payments between buyer and seller.", href: "/escrow/apply-agent" },
  { title: "Host an Elite party", text: "Invite-only parties with guest approval.", href: "/clubs/elite-host" },
  { title: "Paid membership tiers", text: "Unlock more of the site with a tier.", href: "/access" },
]

// One place to ask for any other kind of access. Departments are asked for in the panel under it.
export function MoreAccess() {
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
      <div>
        <h2 className="font-bold text-white">Need different access?</h2>
        <p className="text-sm text-gray-500 mt-1">Pick what you want. Each one tells you what it takes and sends your request to the team. Check the answer here or in your notifications.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-xl border border-white/10 hover:border-red-500/60 p-4 block">
            <div className="font-semibold text-white flex items-center justify-between gap-2">{t.title} <ArrowRight className="w-4 h-4 shrink-0" /></div>
            <div className="text-xs text-gray-400 mt-1">{t.text}</div>
          </Link>
        ))}
      </div>
    </NexusCard>
  )
}
