"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { useSetup } from "@/lib/setup"

const SPACES: Record<string, { title: string; text: string; links: { label: string; href: string }[] }> = {
  clubs: { title: "Night life", text: "Clubs, guest lists and events near you.", links: [{ label: "Browse clubs", href: "/clubs" }, { label: "Events", href: "/clubs/events" }, { label: "My bookings", href: "/clubs/my-bookings" }] },
  wallet: { title: "Ticket draws and DJ demands", text: "Enter the monthly draw and back the DJs you want.", links: [{ label: "Ticket draw", href: "/clubs/lottery" }, { label: "Demand your DJ", href: "/clubs/dj-demand" }, { label: "Wallet", href: "/wallet" }] },
  forum: { title: "Forum and community", text: "Talk with members in the communities you join.", links: [{ label: "Join communities", href: "/forum/join" }, { label: "Open the forum", href: "/forum" }] },
  buy: { title: "Marketplace buyer", text: "Shop and pay with wallet points.", links: [{ label: "Marketplace", href: "/marketplace" }, { label: "Buyer pass", href: "/buyer-pass" }, { label: "My orders", href: "/invoices" }] },
  sell: { title: "Seller", text: "Your store, listings and sales.", links: [{ label: "Apply or manage", href: "/seller/onboarding" }, { label: "Seller dashboard", href: "/seller-dashboard" }] },
  locals: { title: "Local jobs and gigs", text: "Casting calls and gigs around you.", links: [{ label: "Browse gigs", href: "/locals" }, { label: "My candidate profile", href: "/nightlife/candidate" }] },
  employer: { title: "Hiring and my business", text: "Your business account and the jobs you post.", links: [{ label: "Business account", href: "/nightlife/employer" }, { label: "Browse gigs", href: "/locals" }] },
  organiser: { title: "Events and posters", text: "Events are listed by the events team. Ask them from the department request below.", links: [{ label: "See live events", href: "/clubs/events" }] },
  ticketseller: { title: "Club tickets and guest lists", text: "Clubs are listed by the clubs team. Ask them from the department request below.", links: [{ label: "See listed clubs", href: "/clubs" }, { label: "Elite host", href: "/clubs/elite-host" }] },
  student: { title: "Student", text: "Your courses, live sessions and classroom.", links: [{ label: "Student dashboard", href: "/student-dashboard" }, { label: "Courses", href: "/education" }, { label: "Live sessions", href: "/live-sessions" }] },
  teacher: { title: "Teacher", text: "Run your courses and sessions.", links: [{ label: "Teacher dashboard", href: "/teacher-dashboard" }, { label: "Live sessions", href: "/live-sessions" }] },
  trade: { title: "Crypto trades", text: "Trade through a listed intermediary.", links: [{ label: "Find an intermediary", href: "/escrow/intermediaries" }, { label: "My trades", href: "/escrow/my-trades" }] },
  agent: { title: "Intermediary", text: "Your agent desk and trades.", links: [{ label: "Apply or open desk", href: "/escrow/apply-agent" }, { label: "Agent dashboard", href: "/escrow/agent-dashboard" }] },
}
const ALIAS: Record<string, string> = { learn: "student" }

// The dashboard leads with what the member said they came for, so a student sees study tools and a night-life guest sees clubs.
export function MySpaces() {
  const { setup } = useSetup()
  const ids = Array.from(new Set((setup?.interests ?? []).map((i) => ALIAS[i] ?? i))).filter((i) => SPACES[i])
  if (ids.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Your spaces</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ids.map((id) => (
          <NexusCard key={id} className="p-5 bg-white/[0.02] border-white/5 space-y-3">
            <div><div className="font-bold text-white">{SPACES[id].title}</div><p className="text-sm text-gray-400 mt-1">{SPACES[id].text}</p></div>
            <div className="flex flex-wrap gap-2">
              {SPACES[id].links.map((l) => <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 text-sm font-semibold border border-white/15 hover:border-red-500/60 rounded-lg px-3 py-1.5">{l.label} <ArrowRight className="w-3.5 h-3.5" /></Link>)}
            </div>
          </NexusCard>
        ))}
      </div>
    </section>
  )
}
