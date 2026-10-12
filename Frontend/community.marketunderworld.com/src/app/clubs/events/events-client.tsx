"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Loader2 } from "lucide-react"
import { getEvents, type ClubEvent } from "@/lib/api/nightlife"

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })

export function CelebrityEventsClient() {
  const [events, setEvents] = useState<ClubEvent[] | null>(null)
  useEffect(() => { getEvents().then((all) => setEvents(all.filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000).sort((a, b) => +new Date(a.date) - +new Date(b.date)))) }, [])

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans text-[#222]">
      <Navbar />
      <main className="container max-w-[900px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: "Events" }]} /></div>
        <h1 className="text-3xl font-bold mb-2">Club events and DJ nights</h1>
        <p className="text-gray-600 mb-6">Events are checked by the Baalvion team before they appear. Running an event? <Link className="underline font-semibold" href="/clubs/events/submit">Post your event</Link>. Want a particular DJ at a club? <Link className="underline" href="/clubs/dj-demand">Demand your DJ</Link>.</p>
        {events === null ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 text-center text-gray-600">No upcoming events are listed yet.</div>
        ) : (
          <ul className="space-y-4">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/clubs/events/${e.id}`} className="block bg-white border border-gray-200 p-5 hover:border-black">
                  <p className="text-xs text-gray-500">{day(e.date)}</p>
                  <h2 className="text-lg font-bold mt-1">{e.eventName}</h2>
                  <p className="text-sm text-gray-600">{e.djName ? `${e.djName} · ` : ""}{e.venue}{e.city ? `, ${e.city}` : ""}</p>
                  <p className="text-xs font-bold uppercase mt-2">{e.tag}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
