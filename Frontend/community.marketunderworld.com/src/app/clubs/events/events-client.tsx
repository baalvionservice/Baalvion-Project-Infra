"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Star, MapPin, Clock, Ticket, Gavel, Filter, CalendarDays, Music, Users } from "lucide-react";
import { CELEBRITY_EVENTS, type CelebrityEvent } from "@/data/celebrity-events";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";
import { cn } from "@/lib/utils";

const EVENT_TYPES = ["All", "Celebrity Appearance", "DJ Set", "Live Concert"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const typeLabel = (t: CelebrityEvent["type"]) => ({
  celebrity_appearance: "Celebrity Appearance",
  dj_set: "DJ Set",
  live_concert: "Live Concert",
  comedy_night: "Comedy Night",
}[t]);

const typeColor = (t: CelebrityEvent["type"]) => ({
  celebrity_appearance: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  dj_set: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  live_concert: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  comedy_night: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}[t]);

export function CelebrityEventsClient() {
  const [stateFilter, setStateFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = CELEBRITY_EVENTS.filter(e => {
    const matchState = stateFilter === "All" || e.state === stateFilter;
    const matchType = typeFilter === "All" || typeLabel(e.type) === typeFilter;
    return matchState && matchType;
  });

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    { label: "Celebrity & Artist Events" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />
      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#0a0a1a] to-[#1a0520] text-white rounded-2xl p-8 md:p-12 mb-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#ed6c2a]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full mb-5">
              <Star className="w-3.5 h-3.5" />
              Bollywood · Celebrity · DJ Nights
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Celebrity & Artist<br />Events Across India
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Book standard VIP tickets or <strong className="text-white">bid at auction</strong> for premium front-row and backstage access when your favourite celebrities appear at India's top clubs.
            </p>
            <Link
              href="/clubs/dj-demand"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-full transition-all"
            >
              <Music className="w-4 h-4" />
              Demand a DJ at Your City's Club →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {["All", ...INDIAN_NIGHTLIFE_STATES].map(s => (
                <button
                  key={s}
                  onClick={() => setStateFilter(s)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                    stateFilter === s
                      ? "bg-[#222] text-white border-[#222]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#ed6c2a] hover:text-[#ed6c2a]"
                  )}
                >
                  {s === "All" ? "All States" : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {EVENT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                    typeFilter === t
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-bold text-gray-400">No events found</p>
            <p className="text-sm mt-2">Try changing your state or type filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(event => {
              const soldOut = event.standardTicketsSold >= event.standardTicketsTotal;
              const soldPct = Math.round((event.standardTicketsSold / event.standardTicketsTotal) * 100);
              return (
                <Link key={event.id} href={`/clubs/events/${event.id}`} className="group block">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                    {/* Cover */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm", typeColor(event.type))}>
                          {typeLabel(event.type)}
                        </span>
                        {event.auctionEnabled && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm flex items-center gap-1">
                            <Gavel className="w-3 h-3" /> Auction
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                        <div>
                          <h2 className="text-white font-bold text-xl leading-tight mb-1">{event.title}</h2>
                          <div className="flex items-center gap-2 text-white/70 text-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.clubName} · {event.city}
                          </div>
                        </div>
                        {/* Celebrity avatar */}
                        <img
                          src={event.celebrityImage}
                          alt={event.celebrity}
                          className="w-14 h-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0"
                        />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-[#ed6c2a]" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#ed6c2a]" />
                          {event.startTime} – {event.endTime}
                        </span>
                      </div>

                      {/* Ticket availability bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>{event.standardTicketsSold} / {event.standardTicketsTotal} tickets sold</span>
                          <span className={cn("font-bold", soldOut ? "text-red-500" : "text-green-600")}>
                            {soldOut ? "SOLD OUT" : `${event.standardTicketsTotal - event.standardTicketsSold} left`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", soldPct > 80 ? "bg-red-500" : "bg-green-500")}
                            style={{ width: `${soldPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Standard ticket</p>
                          <p className="text-xl font-bold text-gray-900">₹{event.standardTicketPrice.toLocaleString("en-IN")}</p>
                        </div>
                        {event.auctionEnabled && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Top auction bid</p>
                            <p className="text-xl font-bold text-amber-600">₹{event.auctionCurrentBid.toLocaleString("en-IN")}</p>
                          </div>
                        )}
                        <span className="bg-[#ed6c2a] text-white text-sm font-bold px-4 py-2 rounded-full group-hover:bg-[#d85e21] transition-colors">
                          Book Now
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
