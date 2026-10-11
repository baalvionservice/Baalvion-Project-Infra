"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Loader2 } from "lucide-react"
import { getEvent, type ClubEvent } from "@/lib/api/nightlife"

export function EventDetailClient({ id }: { id: string }) {
  const [event, setEvent] = useState<ClubEvent | null | undefined>(undefined)
  useEffect(() => { getEvent(id).then(setEvent) }, [id])

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans text-[#222]">
      <Navbar />
      <main className="container max-w-[800px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6"><Breadcrumbs items={[{ label: "Events", href: "/clubs/events" }, { label: event?.eventName || "Event" }]} /></div>
        {event === undefined ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : event === null ? (
          <div className="bg-white border border-gray-200 p-8 text-center">This event could not be found. <Link className="underline" href="/clubs/events">See all events</Link></div>
        ) : (
          <article className="bg-white border border-gray-200 p-6">
            {event.image && <img src={event.image} alt={event.eventName} className="w-full max-h-80 object-cover mb-5" />}
            <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1 className="text-2xl font-bold mt-1">{event.eventName}</h1>
            <p className="text-gray-700 mt-1">{event.djName ? `${event.djName} · ` : ""}{event.venue}{event.city ? `, ${event.city}` : ""}</p>
            {event.description && <p className="mt-4 text-gray-700 whitespace-pre-line">{event.description}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="bg-black text-white text-sm font-bold px-5 py-2.5">Tickets</a>}
              {event.clubId && <Link href={`/clubs/venue/${event.clubId}`} className="border border-gray-400 text-sm font-bold px-5 py-2.5">About the club</Link>}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
