import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClub } from "@/lib/api/nightlife";
import { MapPin, Star, Share2, Bookmark, Navigation, Clock, Phone, Info, Music, GlassWater, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ClubPhoto } from "@/components/clubs/club-photo";
import { Footer } from "@/components/layout/footer";

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await getClub(id);

  if (!club) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-white pb-20 flex-grow">
        
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-500 font-medium">
            <Link href="/" className="hover:text-[#ed6c2a]">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/clubs/${club.state.toLowerCase()}`} className="hover:text-[#ed6c2a]">{club.state}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{club.name}</span>
          </nav>
        </div>

        {/* Photo: only the venue's own image; no stand-in gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <ClubPhoto src={club.image} name={club.name} className="w-full h-[320px] md:h-[400px] rounded-2xl object-cover" />
        </div>

        {/* Title and Action Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-200 pb-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{club.name}</h1>
              <div className="flex flex-wrap items-center text-gray-600 text-sm gap-3">
                <span className="font-bold text-gray-800">{club.vibe || club.musicType.join(", ")}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /> {club.suburb || club.city}, {club.state}</span>
              </div>
            </div>
            
            {club.rating > 0 && (
              <div className="flex items-center gap-3 bg-green-700 text-white px-4 py-2 rounded-xl">
                <span className="text-2xl font-bold">{club.rating}</span>
                <div className="flex flex-col text-xs font-medium">
                  <div className="flex"><Star className="w-3 h-3 fill-white" /><Star className="w-3 h-3 fill-white" /><Star className="w-3 h-3 fill-white" /><Star className="w-3 h-3 fill-white" /></div>
                  <span>Nightlife</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              <Navigation className="w-4 h-4 text-[#ed6c2a]" /> Direction
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              <Bookmark className="w-4 h-4 text-[#ed6c2a]" /> Bookmark
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              <Share2 className="w-4 h-4 text-[#ed6c2a]" /> Share
            </button>
          </div>
        </div>

        {/* Content Section: 70/30 Split */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Left Column - Overview */}
            <div className="lg:w-2/3">
              {/* Sticky Tabs */}
              <div className="sticky top-[72px] bg-white z-10 border-b border-gray-200 mb-8 flex gap-8 overflow-x-auto">
                {["Overview", "Photos", "Menu", "Events & Gigs", "Reviews"].map((tab, idx) => (
                  <button key={tab} className={`pb-4 text-lg font-medium whitespace-nowrap border-b-2 ${idx === 0 ? "border-[#ed6c2a] text-[#ed6c2a]" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* About Section */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this place</h2>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 text-gray-700 leading-relaxed text-lg">
                  {club.description}
                </div>
                
                {/* Highlights Grid */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Highlights & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-gray-700">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Full Bar Available</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Dance Floor</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Smoking Area</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Valet Parking Available</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Restroom</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Live Entertainment</div>
                </div>
              </section>

              {/* Known For */}
              <section className="mb-10 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What people love here</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full font-medium text-sm">Great DJ Lineups</span>
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium text-sm">VIP Bottle Service</span>
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-medium text-sm">Strict Profile Checks</span>
                  <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full font-medium text-sm">Celebrity Spotting</span>
                </div>
              </section>

              {/* Industry / Hiring Section */}
              {club.requiredRoles && club.requiredRoles.length > 0 && (
                <section className="mb-10 pt-8 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Industry & Hiring Profile</h2>
                  </div>
                  <p className="text-gray-600 mb-4">This venue frequently hires nightlife professionals for the following roles:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {club.requiredRoles.map((role) => (
                      <div key={role} className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="font-semibold text-indigo-900">{role}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/nightlife/candidate" className="text-indigo-600 font-bold hover:underline text-sm flex items-center gap-1">
                      Browse open gigs for {club.name} &rarr;
                    </Link>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Booking & Info Widget (Sticky) */}
            <div className="lg:w-1/3">
              <div className="sticky top-28 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Plan Your Night</h3>
                  <p className="text-gray-500 text-sm mb-6">Cover charges and guestlist rules apply.</p>
                  
                  {/* Info Points */}
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Opening Hours</p>
                        <p className="text-sm text-gray-600">8:00 PM – 1:30 AM (Today)</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Address</p>
                        <p className="text-sm text-gray-600">{club.address || `${club.city}, ${club.state}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <GlassWater className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Average Cost</p>
                        <p className="text-sm text-gray-600">₹{Math.floor(Math.random() * 2000) + 3000} for two (approx.)</p>
                        <p className="text-xs text-gray-400">Exclusive of applicable taxes</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-[#ed6c2a] hover:bg-[#d55e20] text-white font-bold py-4 rounded-xl transition duration-300 shadow-lg shadow-[#ed6c2a]/30 flex justify-center items-center gap-2">
                      Request Guestlist
                    </button>
                    <button className="w-full bg-[#222] hover:bg-black text-white font-bold py-4 rounded-xl transition duration-300 flex justify-center items-center gap-2">
                      Book VIP Table
                    </button>
                  </div>
                </div>
                
                {/* Map Placeholder */}
                <div className="h-48 bg-gray-200 relative">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" alt="Map" className="w-full h-full object-cover opacity-60 grayscale" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white px-4 py-2 rounded-full font-bold text-sm text-gray-800 shadow-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#ed6c2a]" /> View on Maps
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
