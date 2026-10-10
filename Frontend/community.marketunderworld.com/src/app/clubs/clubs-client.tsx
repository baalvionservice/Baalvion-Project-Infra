"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MapPin, Star, Music, Clock, Ticket, Search, ChevronRight, SlidersHorizontal, X, Crown } from "lucide-react";
import { INDIAN_NIGHTLIFE_STATES, type Club } from "@/data/clubs-data";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { ClubPhoto } from "@/components/clubs/club-photo";

// ─── Tier 1 / Tier 2 classification ─────────────────────────────────────────
const TIER1_STATES = ["Maharashtra", "Delhi (NCT)", "Karnataka", "Goa"];
const TIER2_STATES = ["Delhi NCR", "Telangana", "Punjab", "West Bengal", "Tamil Nadu", "Rajasthan"];

// ─── Area/suburb data per state ──────────────────────────────────────────────
const STATE_AREAS: Record<string, string[]> = {
  "Maharashtra": ["All Areas", "Bandra", "Andheri", "Lower Parel", "Worli", "Juhu", "Santacruz", "Dadar", "Colaba", "Powai", "Malad"],
  "Delhi (NCT)": ["All Areas", "Aerocity", "Connaught Place", "Hauz Khas", "South Delhi", "Karol Bagh", "Saket"],
  "Karnataka":   ["All Areas", "Indiranagar", "Koramangala", "UB City", "Whitefield", "Brigade Road", "HSR Layout"],
  "Goa":         ["All Areas", "North Goa", "South Goa", "Baga", "Candolim", "Calangute", "Anjuna", "Panjim"],
  "Delhi NCR":   ["All Areas", "Gurgaon", "Cyber Hub", "DLF Cyber City", "MG Road", "Noida", "Sohna Road"],
  "Telangana":   ["All Areas", "Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Hi-Tech City"],
  "Punjab":      ["All Areas", "Chandigarh Sector 17", "Ludhiana", "Amritsar", "Mohali"],
  "West Bengal": ["All Areas", "Park Street", "Salt Lake", "New Town", "Ballygunge"],
  "Tamil Nadu":  ["All Areas", "Anna Nagar", "T Nagar", "Velachery", "Adyar", "ECR"],
  "Rajasthan":   ["All Areas", "Jaipur MI Road", "Jawahar Nagar", "Malviya Nagar", "Udaipur City"],
};

// ─── Approx km from city center (used to sort clubs by proximity) ─────────────
const AREA_KM: Record<string, number> = {
  "Bandra": 8, "Andheri": 14, "Lower Parel": 5, "Worli": 6, "Juhu": 15,
  "Santacruz": 12, "Dadar": 4, "Colaba": 2, "Powai": 18, "Malad": 22,
  "Aerocity": 16, "Connaught Place": 2, "Hauz Khas": 10, "South Delhi": 8, "Karol Bagh": 5, "Saket": 12,
  "Indiranagar": 7, "Koramangala": 6, "UB City": 4, "Whitefield": 18, "Brigade Road": 3, "HSR Layout": 14,
  "North Goa": 0, "South Goa": 35, "Baga": 14, "Candolim": 11, "Calangute": 13, "Anjuna": 18, "Panjim": 0,
  "Gurgaon": 0, "Cyber Hub": 2, "DLF Cyber City": 3, "MG Road": 4, "Noida": 25, "Sohna Road": 20,
  "Banjara Hills": 3, "Jubilee Hills": 5, "Gachibowli": 12, "Madhapur": 10, "Hi-Tech City": 14,
};

const MUSIC_TYPES = ["All", "Bollywood", "EDM", "Techno", "Hip Hop", "Commercial", "House", "Lounge", "Deep House"];

export function ClubsClient({ clubs, preselectedState }: { clubs: Club[]; preselectedState?: string }) {
  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  let normalizedState = "All";
  if (preselectedState) {
    const matched = INDIAN_NIGHTLIFE_STATES.find(s => toSlug(s) === preselectedState);
    normalizedState = matched || (preselectedState.charAt(0).toUpperCase() + preselectedState.slice(1).toLowerCase());
  }

  const [selectedState, setSelectedState] = useState(normalizedState);
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [selectedMusic, setSelectedMusic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "proximity" | "name">("rating");
  const [showFilters, setShowFilters] = useState(false);

  const availableAreas = selectedState !== "All" ? (STATE_AREAS[selectedState] ?? ["All Areas"]) : ["All Areas"];

  // Reset area when state changes
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedArea("All Areas");
  };

  const filteredClubs = useMemo(() => {
    let result = clubs.filter(club => {
      const matchState = selectedState === "All" || club.state === selectedState;
      const matchArea = selectedArea === "All Areas" || club.suburb === selectedArea || club.city === selectedArea;
      const matchMusic = selectedMusic === "All" || club.musicType.some(m => m.toLowerCase().includes(selectedMusic.toLowerCase()));
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q) || club.city.toLowerCase().includes(q);
      return matchState && matchArea && matchMusic && matchSearch;
    });

    // Sort
    if (sortBy === "rating") result = result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "name") result = result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "proximity") result = result.sort((a, b) => {
      const aKm = AREA_KM[a.suburb ?? ""] ?? AREA_KM[a.city ?? ""] ?? 99;
      const bKm = AREA_KM[b.suburb ?? ""] ?? AREA_KM[b.city ?? ""] ?? 99;
      return aKm - bKm;
    });
    return result;
  }, [clubs, selectedState, selectedArea, selectedMusic, searchQuery, sortBy]);

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    ...(selectedState !== "All" ? [{ label: selectedState }] : []),
    ...(selectedArea !== "All Areas" ? [{ label: selectedArea }] : []),
  ];

  const activeFiltersCount = [
    selectedState !== "All", selectedArea !== "All Areas", selectedMusic !== "All"
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Feature Banners */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-[#ed6c2a] to-[#ff9b6a] rounded-2xl text-white shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <Ticket className="w-7 h-7 mb-2 opacity-90" />
              <h2 className="text-lg font-bold mb-1">Monthly Ticket Lottery</h2>
              <p className="text-white/85 text-sm">1,000 free VIP tickets every month. Participate for just $6.</p>
            </div>
            <Link href="/clubs/lottery" className="bg-white/20 hover:bg-white/30 text-white text-center font-bold py-2 rounded-xl text-sm transition-colors">
              Participate →
            </Link>
          </div>
          <div className="p-5 bg-gradient-to-br from-[#1a0520] to-[#2a0535] rounded-2xl text-white shadow-lg border border-purple-500/20 flex flex-col justify-between">
            <div className="mb-4">
              <Star className="w-7 h-7 mb-2 text-purple-400" />
              <h2 className="text-lg font-bold mb-1">Celebrity Appearances</h2>
              <p className="text-white/70 text-sm">Book tickets or bid for premium seats when stars appear at clubs.</p>
            </div>
            <Link href="/clubs/events" className="bg-purple-600 hover:bg-purple-500 text-white text-center font-bold py-2 rounded-xl text-sm transition-colors">
              Browse Events →
            </Link>
          </div>
          <div className="p-5 bg-gradient-to-br from-[#050e1a] to-[#050a14] rounded-2xl text-white shadow-lg border border-blue-500/20 flex flex-col justify-between">
            <div className="mb-4">
              <Music className="w-7 h-7 mb-2 text-blue-400" />
              <h2 className="text-lg font-bold mb-1">Demand Your DJ</h2>
              <p className="text-white/70 text-sm">Vote & pledge to bring your favourite DJ to your city's pub.</p>
            </div>
            <Link href="/clubs/dj-demand" className="bg-blue-600 hover:bg-blue-500 text-white text-center font-bold py-2 rounded-xl text-sm transition-colors">
              Start Demanding →
            </Link>
          </div>
          <div className="p-5 bg-gradient-to-br from-[#111] to-[#2a2a2a] rounded-2xl text-white shadow-lg border border-amber-500/20 flex flex-col justify-between">
            <div className="mb-4">
              <Crown className="w-7 h-7 mb-2 text-amber-500" />
              <h2 className="text-lg font-bold mb-1">Elite Hosted Parties</h2>
              <p className="text-white/70 text-sm">Host a massive VIP night or apply to join an exclusive billionaire party.</p>
            </div>
            <Link href="/clubs/elite-host" className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 text-center font-bold py-2 rounded-xl text-sm transition-colors">
              Explore Elite Host →
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar Filters ─────────────────────────────────────────────── */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-24">

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search clubs, cities..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#ed6c2a] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                  </button>
                )}
              </div>

              {/* Tier 1 States */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#ed6c2a] rounded-full" /> Tier 1 Cities
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleStateChange("All")}
                    className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                      selectedState === "All" ? "bg-[#ed6c2a] text-white" : "text-gray-700 hover:bg-gray-100"
                    )}>
                    All States
                  </button>
                  {TIER1_STATES.map(state => (
                    <button key={state} onClick={() => handleStateChange(state)}
                      className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-between",
                        selectedState === state ? "bg-[#ed6c2a] text-white" : "text-gray-700 hover:bg-gray-100"
                      )}>
                      {state}
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",
                        selectedState === state ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                      )}>T1</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier 2 States */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" /> Tier 2 Cities
                </p>
                <div className="space-y-1">
                  {TIER2_STATES.map(state => (
                    <button key={state} onClick={() => handleStateChange(state)}
                      className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-between",
                        selectedState === state ? "bg-[#222] text-white" : "text-gray-700 hover:bg-gray-100"
                      )}>
                      {state}
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",
                        selectedState === state ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                      )}>T2</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Area / Proximity filter */}
              {selectedState !== "All" && availableAreas.length > 1 && (
                <div className="mb-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ed6c2a]" /> Area / Neighbourhood
                  </p>
                  <div className="space-y-1">
                    {availableAreas.map(area => {
                      const km = area !== "All Areas" ? AREA_KM[area] : null;
                      return (
                        <button key={area} onClick={() => setSelectedArea(area)}
                          className={cn("w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between",
                            selectedArea === area ? "bg-gray-900 text-white font-bold" : "text-gray-700 hover:bg-gray-100"
                          )}>
                          {area}
                          {km != null && (
                            <span className={cn("text-xs", selectedArea === area ? "text-gray-300" : "text-gray-400")}>
                              ~{km} km
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Music type */}
              <div className="mb-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#ed6c2a]" /> Music Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSIC_TYPES.map(m => (
                    <button key={m} onClick={() => setSelectedMusic(m)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        selectedMusic === m ? "bg-[#ed6c2a] border-[#ed6c2a] text-white" : "border-gray-200 text-gray-600 hover:border-[#ed6c2a] hover:text-[#ed6c2a]"
                      )}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sort By</p>
                <div className="space-y-1">
                  {([["rating","⭐ Top Rated"],["proximity","📍 Nearest First"],["name","🔤 Name A–Z"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setSortBy(val)}
                      className={cn("w-full text-left px-3 py-2 rounded-xl text-sm transition-all font-medium",
                        sortBy === val ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { handleStateChange("All"); setSelectedMusic("All"); setSearchQuery(""); setSortBy("rating"); }}
                  className="w-full mt-4 text-sm text-red-500 hover:text-red-700 font-bold flex items-center justify-center gap-2 py-2 border border-red-100 rounded-xl hover:bg-red-50 transition-all"
                >
                  <X className="w-4 h-4" /> Clear All Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </aside>

          {/* ── Main Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-[#111] mb-2">
                {selectedState === "All" ? "Indian Nightclubs" : `${selectedState} Nightclubs`}
                {selectedArea !== "All Areas" && <span className="text-[#ed6c2a]"> · {selectedArea}</span>}
              </h1>
              <p className="text-gray-500 text-sm">
                {filteredClubs.length} club{filteredClubs.length !== 1 ? "s" : ""} found
                {selectedArea !== "All Areas" && AREA_KM[selectedArea] != null && (
                  <span className="ml-2 text-[#ed6c2a]">· ~{AREA_KM[selectedArea]} km from city centre</span>
                )}
              </p>
            </div>

            {/* Proximity note */}
            {sortBy === "proximity" && selectedState !== "All" && (
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#ed6c2a]" />
                Sorted by approximate distance from city centre
              </div>
            )}

            {/* No results */}
            {filteredClubs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-4">🏙️</p>
                <p className="text-xl font-bold text-gray-400 mb-2">No clubs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search query.</p>
                <button onClick={() => { handleStateChange("All"); setSelectedMusic("All"); setSearchQuery(""); }}
                  className="mt-4 text-sm text-[#ed6c2a] font-bold hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClubs.map((club) => {
                  const clubKm = AREA_KM[club.suburb ?? ""] ?? AREA_KM[club.city ?? ""];
                  return (
                    <Link key={club.id} href={`/clubs/${toSlug(club.state)}/${club.id}`} className="group block">
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-48 h-44 sm:h-auto flex-shrink-0">
                            <ClubPhoto src={club.image} name={club.name} className="w-full h-full object-cover" />
                            {club.rating > 0 && (
                              <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-2 py-1 rounded-lg">
                                <Star className="w-3 h-3 fill-white" /> {club.rating}
                              </div>
                            )}
                            {clubKm != null && (
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> ~{clubKm} km
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#ed6c2a] transition-colors">{club.name}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#ed6c2a]" />{club.suburb ? `${club.suburb}, ` : ""}{club.city}</span>
                                  <span className="text-gray-300">·</span>
                                  <span className="flex items-center gap-1">
                                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold",
                                      TIER1_STATES.includes(club.state) ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                      {TIER1_STATES.includes(club.state) ? "Tier 1" : "Tier 2"}
                                    </span>
                                    {club.state}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#ed6c2a] transition-colors flex-shrink-0 mt-1" />
                            </div>

                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{club.description}</p>

                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Music className="w-3.5 h-3.5 text-purple-500" />
                                {club.musicType.slice(0,3).join(", ")}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {club.daysOpen}
                              </span>
                              {club.vibe && (
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-600">{club.vibe}</span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                {club.coverCharge}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Highlighted Action Buttons ── */}
                        <div className="grid grid-cols-2 gap-0 border-t-2 border-gray-100" onClick={e => e.preventDefault()}>
                          <Link
                            href={`/clubs/${toSlug(club.state)}/${club.id}/guest-list`}
                            onClick={e => e.stopPropagation()}
                            className="relative flex flex-col items-center justify-center gap-1.5 py-5 bg-gradient-to-br from-[#fff5f0] to-[#ffe8da] hover:from-[#ed6c2a] hover:to-[#d85e21] border-r border-gray-100 transition-all duration-300 group/gl overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-[#ed6c2a] opacity-0 group-hover/gl:opacity-100 transition-opacity duration-300" />
                            <span className="relative text-2xl">📋</span>
                            <span className="relative text-sm font-black tracking-wide text-[#ed6c2a] group-hover/gl:text-white transition-colors">Guest List</span>
                            <span className="relative text-[10px] font-semibold text-[#ed6c2a]/60 group-hover/gl:text-white/75 transition-colors uppercase tracking-widest">Free Entry</span>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ed6c2a] scale-x-0 group-hover/gl:scale-x-100 transition-transform duration-300" />
                          </Link>
                          <Link
                            href={`/clubs/${toSlug(club.state)}/${club.id}/vip-tables`}
                            onClick={e => e.stopPropagation()}
                            className="relative flex flex-col items-center justify-center gap-1.5 py-5 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] hover:from-[#111] hover:to-[#333] transition-all duration-300 group/vip overflow-hidden"
                          >
                            <div className="absolute inset-0 opacity-0 group-hover/vip:opacity-20 bg-gradient-to-br from-yellow-400 to-amber-600 transition-opacity duration-300" />
                            <span className="relative text-2xl">🥂</span>
                            <span className="relative text-sm font-black tracking-wide text-white">VIP Table</span>
                            <span className="relative text-[10px] font-semibold text-white/40 group-hover/vip:text-amber-400/90 transition-colors uppercase tracking-widest">Bottle Service</span>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 scale-x-0 group-hover/vip:scale-x-100 transition-transform duration-300" />
                          </Link>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
