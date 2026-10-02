"use client"

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MapPin, Star, Music, Clock, Ticket, Search, ChevronRight } from "lucide-react";
import { INDIAN_CLUBS } from "@/data/clubs-data";
import { cn } from "@/lib/utils";

export function ClubsClient({ preselectedState }: { preselectedState?: string }) {
  const normalizedState = preselectedState 
    ? preselectedState.charAt(0).toUpperCase() + preselectedState.slice(1).toLowerCase()
    : "All";
    
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = INDIAN_CLUBS.filter((club) => {
    const matchesCity = normalizedState === "All" || club.city === normalizedState;
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          club.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        
        {/* Breadcrumb */}
        <div className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-[#ed6c2a] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/clubs" className="hover:text-[#ed6c2a] transition-colors">Clubs</Link>
          {normalizedState !== "All" && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#ed6c2a]">{normalizedState}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 bg-white p-6 md:p-10 shadow-sm border border-gray-200">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#111]">
              {normalizedState === "All" ? "Indian Nightclubs" : `${normalizedState} Nightclubs`}
            </h1>
            
            <p className="text-lg text-[#555] mb-8 leading-relaxed">
              Get on the free guest list for top nightclubs in {normalizedState === "All" ? "Mumbai, Delhi, and Gurgaon" : normalizedState}. Book VIP bottle service, check 2026 DJ lineups, dress codes & prices.
            </p>

            {/* City Tabs (Newspaper Style) */}
            <div className="border-b-2 border-gray-100 mb-8 flex gap-4">
              {["Mumbai", "Delhi", "Gurgaon"].map((city) => (
                <Link
                  key={city}
                  href={`/clubs/${city.toLowerCase()}`}
                  className={cn(
                    "pb-3 font-bold text-sm uppercase tracking-wide border-b-2 -mb-[2px] transition-colors",
                    normalizedState === city
                      ? "border-[#ed6c2a] text-[#ed6c2a]"
                      : "border-transparent text-gray-500 hover:text-[#ed6c2a]"
                  )}
                >
                  {city}
                </Link>
              ))}
            </div>

            {/* Club List (Newspaper Standard Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredClubs.length === 0 ? (
                <div className="col-span-full py-10 text-center">
                  <h3 className="text-xl font-bold text-gray-700">No clubs found</h3>
                </div>
              ) : (
                filteredClubs.map((club) => (
                  <div key={club.id} className="flex flex-col">
                    <div className="relative h-56 w-full mb-4 group cursor-pointer overflow-hidden">
                      <img
                        src={club.image}
                        alt={club.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-0 left-0 bg-[#ed6c2a] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                        {club.city}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-2 hover:text-[#ed6c2a] cursor-pointer transition-colors">
                      {club.name}
                    </h3>
                    
                    <p className="text-[#666] text-sm mb-4 line-clamp-2">
                      {club.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link 
                        href={`/clubs/${club.city.toLowerCase()}/${club.id}/guest-list`}
                        className="bg-[#ed6c2a] hover:bg-[#d85e21] text-white text-center font-bold py-3 text-sm transition-colors"
                      >
                        GUEST LIST
                      </Link>
                      <Link
                        href={`/clubs/${club.city.toLowerCase()}/${club.id}/vip-tables`}
                        className="bg-[#222] hover:bg-[#000] text-white text-center font-bold py-3 text-sm transition-colors"
                      >
                        VIP TABLES
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] space-y-8">
            <div className="bg-white p-6 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold uppercase tracking-widest text-center border-b border-gray-100 pb-4 mb-4">
                Search Clubs
              </h4>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 p-3 text-sm outline-none focus:border-[#ed6c2a]"
              />
            </div>

            <div className="bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h4 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4 mb-4">
                Sponsors
              </h4>
              <div className="w-full h-[250px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                Advertisement Space
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
