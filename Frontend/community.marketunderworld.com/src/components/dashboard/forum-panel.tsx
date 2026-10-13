"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { getCommunities, type Community } from "@/lib/api/community"
import { getMyProfile } from "@/lib/api/profile"
import { groupBoards } from "@/lib/forum-groups"

// The forum from the member's own dashboard: every board by group, with a paid member's tier shown alongside.
export function ForumPanel() {
  const [boards, setBoards] = useState<Community[] | null>(null)
  const [tiers, setTiers] = useState<{ slug: string; name: string }[]>([])

  useEffect(() => {
    getCommunities().then(setBoards).catch(() => setBoards([]))
    getMyProfile().then((p) => setTiers(p.tiers ?? [])).catch(() => {})
  }, [])

  const groups = groupBoards(boards ?? [])
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-red-400" /> Forum</h2>
          <p className="text-sm text-gray-400 mt-1">
            {tiers.length ? <>Your access: {tiers.map((t) => t.name).join(", ")}. Every open board is yours to read and post in.</> : <>Open boards are free to read and post in once you are signed in. <Link href="/access" className="text-cyan-400">See what paid access adds</Link>.</>}
          </p>
        </div>
        <Link href="/forum" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest">Open the forum</Link>
      </div>
      {boards === null ? <p className="text-sm text-gray-500">Loading the boards…</p> : (
        <div className="grid sm:grid-cols-2 gap-5">
          {groups.map((g) => (
            <div key={g.slug}>
              <Link href={`/forum/category/${g.slug}`} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-white">{g.title}</Link>
              <ul className="mt-2 space-y-1">
                {g.boards.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/forum/${b.slug}`} className="flex items-center justify-between gap-3 text-sm text-gray-200 hover:text-white rounded px-2 py-1.5 hover:bg-white/5">
                      <span className="truncate">{b.name}</span>
                      <span className="text-[11px] text-gray-500 shrink-0">{b.topicCount} thread{b.topicCount === 1 ? "" : "s"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </NexusCard>
  )
}
