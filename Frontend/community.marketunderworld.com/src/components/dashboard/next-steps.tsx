"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Circle } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { DESTINATIONS, interestTitle, useSetup } from "@/lib/setup"

// Tells a signed-in member what is left to set up, and takes them to what they said they came for.
export function NextSteps() {
  const { setup } = useSetup()
  if (!setup) return null
  const goals = setup.interests.filter((i) => DESTINATIONS[i])
  if (setup.complete && goals.length === 0) return null
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-5">
      {!setup.complete && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-white">Finish setting up: {setup.done} of {setup.total} done</h2>
            {setup.next && <Link href={setup.next.href} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">{setup.next.label} <ArrowRight className="w-4 h-4" /></Link>}
          </div>
          <div className="h-1.5 rounded bg-white/10 mb-4"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${(setup.done / setup.total) * 100}%` }} /></div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {setup.items.map((i) => (
              <li key={i.key} className={`flex items-center gap-2 ${i.done ? "text-gray-500" : "text-gray-200"}`}>
                {i.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 text-gray-600 shrink-0" />}
                {i.done ? i.label : <Link className="underline underline-offset-2" href={i.href}>{i.label}</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {goals.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">Where you wanted to go</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((g) => (
              <Link key={g} href={DESTINATIONS[g].href} className="rounded-xl border border-white/10 hover:border-red-500/60 p-4 block">
                <div className="text-sm text-gray-400">{interestTitle(g)}</div>
                <div className="font-semibold text-white mt-1 flex items-center gap-2">{DESTINATIONS[g].label} <ArrowRight className="w-4 h-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </NexusCard>
  )
}
