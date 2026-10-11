"use client"

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MapPin, Star, Music, Clock, Ticket, Search, ChevronRight } from "lucide-react";
import { INDIAN_NIGHTLIFE_STATES, type Club } from "@/data/clubs-data";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { ClubPhoto } from "@/components/clubs/club-photo";

export function ClubsClient({ clubs, preselectedState }: { clubs: Club[]; preselectedState?: string }) {
  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  let normalizedState = "All";
  if (preselectedState) {
    const matched = INDIAN_NIGHTLIFE_STATES.find(s => toSlug(s) === preselectedState);
    normalizedState = matched || (preselectedState.charAt(0).toUpperCase() + preselectedState.slice(1).toLowerCase());
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [suburbFilter, setSuburbFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(24);

  const MAHARASHTRA_SUBURBS = ["All", "Andheri", "Bandra", "Santacruz", "Lower Parel", "Worli", "Dadar", "Juhu"];

  const filteredClubs = clubs.filter((club) => {
    const matchesState = normalizedState === "All" || club.state === normalizedState;
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          club.description.toLowerCase().includes(searchQuery.toLowerCase());
                          
    let matchesSuburb = true;
    if (normalizedState === "Maharashtra" && suburbFilter !== "All") {
      matchesSuburb = club.suburb === suburbFilter;
    }

    return matchesState && matchesSearch && matchesSuburb;
  });

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    ...(normalizedState !== "All" ? [{ label: normalizedState }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
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

            {/* Premium Location Filter */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#ed6c2a]" />
                <h3 className="text-lg font-bold text-gray-800">Explore by Location</h3>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {["All", ...INDIAN_NIGHTLIFE_STATES].map((stateName) => {
                  const isActive = normalizedState === stateName || (normalizedState === "All" && stateName === "All");
                  return (
                    <Link
                      key={stateName}
                      href={stateName === "All" ? "/clubs" : `/clubs/${toSlug(stateName)}`}
                      onClick={() => setSuburbFilter("All")}
                      className={cn(
                        "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border",
                        isActive
                          ? "bg-[#222] text-white border-[#222] shadow-md scale-105"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#ed6c2a] hover:text-[#ed6c2a] hover:bg-[#fff9f5]"
                      )}
                    >
                      {stateName}
                    </Link>
                  );
                })}
              </div>

              {/* Suburb Filter for Maharashtra */}
              {normalizedState === "Maharashtra" && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Mumbai Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {MAHARASHTRA_SUBURBS.map((suburb) => {
                      const isActive = suburbFilter === suburb;
                      return (
                        <button
                          key={suburb}
                          onClick={() => setSuburbFilter(suburb)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                            isActive
                              ? "bg-[#ed6c2a] text-white border-[#ed6c2a] shadow-sm"
                              : "bg-white text-gray-600 border-gray-300 hover:border-[#ed6c2a] hover:text-[#ed6c2a]"
                          )}
                        >
                          {suburb}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Club List (Newspaper Standard Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredClubs.length === 0 ? (
                <div className="col-span-full py-10 text-center">
                  <h3 className="text-xl font-bold text-gray-700">No clubs found</h3>
                </div>
              ) : (
                filteredClubs.slice(0, visibleCount).map((club) => (
                  <div key={club.id} className="flex flex-col">
                    <Link href={`/clubs/venue/${club.id}`} className="relative h-56 w-full mb-4 group cursor-pointer overflow-hidden block">
                      <ClubPhoto
                        src={club.image}
                        name={club.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                        <div className="absolute top-0 left-0 bg-[#ed6c2a] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                        {club.state} - {club.suburb || club.city}
                      </div>
                    </Link>

                    <Link href={`/clubs/venue/${club.id}`}>
                      <h3 className="text-2xl font-bold mb-2 hover:text-[#ed6c2a] cursor-pointer transition-colors">
                        {club.name}
                      </h3>
                    </Link>
                    
                    <p className="text-[#666] text-sm mb-4 line-clamp-2">
                      {club.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link 
                        href={`/clubs/${toSlug(club.state)}/${club.id}/guest-list`}
                        className="bg-[#ed6c2a] hover:bg-[#d85e21] text-white text-center font-bold py-3 text-sm transition-colors"
                      >
                        GUEST LIST
                      </Link>
                      <Link
                        href={`/clubs/${toSlug(club.state)}/${club.id}/vip-tables`}
                        className="bg-[#222] hover:bg-[#000] text-white text-center font-bold py-3 text-sm transition-colors"
                      >
                        VIP TABLES
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            {filteredClubs.length > visibleCount && (
              <div className="pt-8 text-center">
                <p className="text-xs text-gray-500 mb-3">Showing {visibleCount} of {filteredClubs.length} clubs</p>
                <button onClick={() => setVisibleCount((n) => n + 24)} className="px-8 py-3 border border-gray-300 text-sm font-bold uppercase tracking-widest hover:border-[#ed6c2a] hover:text-[#ed6c2a] transition-colors">Show more clubs</button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] space-y-8 order-first lg:order-last">
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

          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
