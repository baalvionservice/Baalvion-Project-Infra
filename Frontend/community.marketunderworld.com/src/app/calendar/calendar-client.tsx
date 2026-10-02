"use client"

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { CLUB_EVENTS, ClubEvent } from "@/data/events-data";
import { INDIAN_CLUBS } from "@/data/clubs-data";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

export function CalendarClient() {
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-02");
  const [selectedVenue, setSelectedVenue] = useState<string>("ALL");

  // Get unique venues for the dropdown
  const venues = ["ALL", ...Array.from(new Set(INDIAN_CLUBS.map(club => club.name)))];

  // Filter events
  const filteredEvents = CLUB_EVENTS.filter((event) => {
    // In a real app, you'd filter by exact date or month. For this demo, we'll just show all or filter by venue.
    const venueMatch = selectedVenue === "ALL" || event.venue === selectedVenue;
    return venueMatch;
  });

  return (
    <div className="min-h-screen bg-white text-[#222] font-sans">
      <Navbar />

      <main className="pt-20 pb-16">
        
        {/* Title Section */}
        <div className="bg-[#f3f4f7] py-8 border-b border-gray-200">
          <div className="container max-w-[1200px] mx-auto px-4 text-center">
            <Breadcrumbs items={[{ label: "Calendar" }]} className="mb-4 justify-center" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#111] mb-2">
              Indian Nightclub Event Calendar & DJ Schedule
            </h1>
            <p className="text-[#555] text-sm max-w-2xl mx-auto">
              View all nightclub events in Mumbai, Delhi, and Gurgaon. Buy tickets, get on our free guest lists, or inquire about a VIP table.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-b border-gray-200 py-4 mb-8 sticky top-[64px] z-10 shadow-sm">
          <div className="container max-w-[1000px] mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-[#555] mb-1">Select Venue:</label>
                <select 
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="w-full border border-gray-300 p-2 text-sm outline-none focus:border-[#ed6c2a] bg-white h-[38px]"
                >
                  {venues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-[#555] mb-1">Select Date:</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-300 p-2 text-sm outline-none focus:border-[#ed6c2a] h-[38px] pr-10"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-gray-100 border-l border-gray-300 flex items-center justify-center text-gray-500 pointer-events-none">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <button className="w-full bg-[#eee] text-[#555] font-bold h-[38px] border border-gray-300 hover:bg-gray-200 transition-colors text-sm uppercase">
                  Search
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Main Calendar Content */}
        <div className="container max-w-[1200px] mx-auto px-4">
          
          {/* Month Navigation */}
          <div className="flex justify-center items-center gap-4 mb-10">
            <button className="text-[#555] hover:text-[#ed6c2a] transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h2 className="text-xl font-bold text-[#111]">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
            </h2>
            <button className="text-[#555] hover:text-[#ed6c2a] transition-colors">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex flex-col group border border-gray-100 pb-3 hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-64 w-full mb-3 overflow-hidden">
                  <Link href={`/calendar/${event.id}`}>
                    <img 
                      src={event.image} 
                      alt={event.eventName} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </div>

                <div className="px-3 flex-1 flex flex-col">
                  {/* Event Name */}
                  <h3 className="text-[15px] font-bold text-[#111] leading-tight mb-1 line-clamp-2">
                    <Link href={`/calendar/${event.id}`} className="hover:text-[#ed6c2a]">
                      {event.eventName}
                    </Link>
                  </h3>

                  {/* Venue Name */}
                  <h4 className="text-[13px] font-bold text-[#555] uppercase mb-2">
                    {event.venue}
                  </h4>

                  {/* Date */}
                  <div className="text-[12px] text-gray-500 mb-4 font-semibold">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Link 
                      href={`/calendar/${event.id}`}
                      className="block w-full bg-[#f96a30] hover:bg-[#e05520] text-[#000] text-center font-bold py-2 text-[11px] mb-2 transition-colors uppercase tracking-wide"
                    >
                      VIEW EVENT DETAILS
                    </Link>
                    <p className="text-center text-[10px] font-bold uppercase tracking-wider text-[#555]">
                      {event.tag === "FREE ON GUEST LIST" && <span className="mr-1">🔥</span>}
                      {event.tag}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold text-gray-400">No events found for this venue.</h3>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
