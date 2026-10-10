"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Crown, ShieldCheck, Car, GlassWater, CheckCircle2, Search, MapPin } from "lucide-react";
import { INDIAN_NIGHTLIFE_STATES, INDIAN_CLUBS } from "@/data/clubs-data";
import { MUMBAI_CLUBS } from "@/data/mumbai-clubs";
import { useToast } from "@/hooks/use-toast";
import { admin } from "@/lib/api/nightlife";

const ELITE_HOST_KEY = "baalvion_elite_host_applications";

const ALL_CLUBS = [...INDIAN_CLUBS, ...MUMBAI_CLUBS];

const DUMMY_PARTIES = [
  {
    id: "p1",
    hostAlias: "Mr. R.S.",
    clubName: "Bastian - At The Top",
    city: "Mumbai",
    date: "This Friday, 10 PM",
    budget: "₹5,000,000+",
    slots: 10,
    filled: 4,
    perks: ["S-Class Pick/Drop", "Presidential Table", "Unlimited Food & Premium Drinks"],
  },
  {
    id: "p2",
    hostAlias: "Anonymous Elite",
    clubName: "Dragonfly Experience",
    city: "Mumbai",
    date: "Next Saturday, 11 PM",
    budget: "₹1,000,000",
    slots: 5,
    filled: 2,
    perks: ["Luxury Sedan Cab", "VVIP Table", "Dom Perignon"],
  },
];

export function EliteHostClient() {
  // ── All hooks declared at the top — no hooks after computed values ──
  const [activeTab, setActiveTab] = useState<"host" | "guest">("guest");
  const [parties, setParties] = useState<any[]>(DUMMY_PARTIES);
  const [budget, setBudget] = useState("500000");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [selectedArea, setSelectedArea] = useState("Dadar");
  const [selectedClub, setSelectedClub] = useState("mumbai-c1");

  React.useEffect(() => {
    admin.eliteHostApplications()
      .then(res => {
        if (res.items && res.items.length > 0) {
          const approved = res.items.filter(i => i.status === "approved");
          if (approved.length > 0) {
            setParties(approved.map((i: any) => ({
              id: i.id,
              hostAlias: i.hostAlias || "Anonymous Elite",
              clubName: i.clubId || "Exclusive Venue",
              city: i.city || "Mumbai",
              date: i.date || "Upcoming",
              budget: `₹${Number(i.budget || 500000).toLocaleString("en-IN")}`,
              slots: i.guests || 5,
              filled: 0,
              perks: i.perks || ["Luxury Transport", "Premium Table"],
            })));
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Derived values via useMemo — no hooks after these ──
  const availableClubsInState = useMemo(
    () => ALL_CLUBS.filter(c => c.state === selectedState),
    [selectedState]
  );

  const uniqueCities = useMemo(
    () => Array.from(new Set(availableClubsInState.map(c => c.city))).filter(Boolean).sort() as string[],
    [availableClubsInState]
  );

  const availableClubsInCity = useMemo(
    () => availableClubsInState.filter(c => c.city === selectedCity),
    [availableClubsInState, selectedCity]
  );

  const uniqueAreas = useMemo(
    () => Array.from(new Set(availableClubsInCity.map(c => c.suburb || c.city))).filter(Boolean).sort() as string[],
    [availableClubsInCity]
  );

  const availableVenues = useMemo(
    () => availableClubsInCity.filter(c => (c.suburb || c.city) === selectedArea),
    [availableClubsInCity, selectedArea]
  );

  // ── Event Handlers ──
  const handleStateChange = (newState: string) => {
    const clubsInState = ALL_CLUBS.filter(c => c.state === newState);
    const cities = Array.from(new Set(clubsInState.map(c => c.city))).filter(Boolean).sort() as string[];
    const firstCity = cities[0] || "";
    const clubsInCity = clubsInState.filter(c => c.city === firstCity);
    const areas = Array.from(new Set(clubsInCity.map(c => c.suburb || c.city))).filter(Boolean).sort() as string[];
    const firstArea = areas[0] || "";
    const venues = clubsInCity.filter(c => (c.suburb || c.city) === firstArea);
    setSelectedState(newState);
    setSelectedCity(firstCity);
    setSelectedArea(firstArea);
    setSelectedClub(venues[0]?.id || "");
  };

  const handleCityChange = (newCity: string) => {
    const clubsInCity = availableClubsInState.filter(c => c.city === newCity);
    const areas = Array.from(new Set(clubsInCity.map(c => c.suburb || c.city))).filter(Boolean).sort() as string[];
    const firstArea = areas[0] || "";
    const venues = clubsInCity.filter(c => (c.suburb || c.city) === firstArea);
    setSelectedCity(newCity);
    setSelectedArea(firstArea);
    setSelectedClub(venues[0]?.id || "");
  };

  const handleAreaChange = (newArea: string) => {
    const venues = availableClubsInCity.filter(c => (c.suburb || c.city) === newArea);
    setSelectedArea(newArea);
    setSelectedClub(venues[0]?.id || "");
  };

  const { toast } = useToast();
  const [appRef, setAppRef] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      toast({ title: "Agreement Required", description: "You must agree to all host responsibilities before proceeding.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const application = {
        budget,
        state: selectedState,
        city: selectedCity,
        area: selectedArea,
        clubId: selectedClub,
        clubName: ALL_CLUBS.find(c => c.id === selectedClub)?.name ?? selectedClub,
      };
      const result = await admin.createEliteHostApplication(application);
      setAppRef(result?.id ?? `EH-${Date.now()}`);
      toast({ title: "Application Submitted! 🎉", description: "Your Elite Host application is under review. We will contact you within 48 hours." });
    } catch {
      toast({ title: "Submission Failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = () => {
    toast({ title: "Interest Noted!", description: "Sign up and complete your profile to apply for Elite Party invitations.", variant: "default" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      <Navbar />
      
      <main className="mt-16 pb-20">
        {/* Hero Header */}
        <div className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1574365561657-3f820253f545?q=80&w=2000" alt="VIP Night" className="w-full h-full object-cover opacity-20 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
          </div>
          
          <div className="relative max-w-5xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-sm mb-6 border border-amber-500/20">
              <Crown className="w-4 h-4" /> The Billionaire Experience
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
              Elite Host Program
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Verified high-net-worth individuals sponsor unforgettable nights. Select ladies experience the pinnacle of luxury, safely.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setActiveTab("guest")}
                className={`px-8 py-3.5 rounded-full font-bold transition-all ${
                  activeTab === "guest" 
                  ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                  : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Join as a Guest
              </button>
              <button
                onClick={() => setActiveTab("host")}
                className={`px-8 py-3.5 rounded-full font-bold transition-all ${
                  activeTab === "host" 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]" 
                  : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Become a Host
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          
          {/* ── GUEST VIEW ── */}
          {activeTab === "guest" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Upcoming Elite Parties</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Search by city..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white w-64" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parties.map(party => (
                  <div key={party.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-amber-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Budget: {party.budget}</div>
                        <h3 className="text-xl font-bold text-white mb-1">{party.hostAlias}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {party.clubName}, {party.city}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">{party.date}</div>
                        <div className="text-xs text-gray-400 mt-2">{party.slots - party.filled} slots left</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {party.perks.map(perk => (
                        <div key={perk} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-amber-500" /> {perk}
                        </div>
                      ))}
                    </div>

                    <button onClick={handleApply} className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                      Apply to Join (KYC Required)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HOST VIEW ── */}
          {activeTab === "host" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Responsibilities Sidebar */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-3xl p-6">
                  <h3 className="text-xl font-black text-amber-500 mb-6 flex items-center gap-2">
                    <Crown className="w-6 h-6" /> Host Responsibilities
                  </h3>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">Pick Up & Drop</h4>
                        <p className="text-sm text-gray-400">Provide secure, premium transportation for all female guests.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <GlassWater className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">All Expenses Covered</h4>
                        <p className="text-sm text-gray-400">VIP table, all food, and premium beverages must be fully covered.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">Zero Tolerance Policy</h4>
                        <p className="text-sm text-gray-400">Absolute respect is mandatory. Any misbehavior = instant ban + legal action.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleHostSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-2xl font-bold mb-6">Create Your VIP Party</h2>
                  
                  <div className="space-y-5">
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Committed Budget (Minimum ₹5,00,000)</label>
                      <select 
                        value={budget} 
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="500000">₹5,00,000</option>
                        <option value="750000">₹7,50,000</option>
                        <option value="1000000">₹10,00,000 (1 Million)</option>
                        <option value="2500000">₹25,00,000</option>
                        <option value="5000000">₹50,00,000+</option>
                      </select>
                    </div>

                    {/* Location: 2×2 grid on mobile, 4-col on large */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">State</label>
                      <select 
                        value={selectedState} 
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                      >
                        {INDIAN_NIGHTLIFE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                        <select 
                          value={selectedCity} 
                          onChange={(e) => handleCityChange(e.target.value)}
                          disabled={!uniqueCities.length}
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 text-sm"
                        >
                          {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                          {!uniqueCities.length && <option value="">No cities</option>}
                        </select>
                      </div>

                      {/* Area / Suburb */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Area / Suburb</label>
                        <select 
                          value={selectedArea} 
                          onChange={(e) => handleAreaChange(e.target.value)}
                          disabled={!uniqueAreas.length}
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 text-sm"
                        >
                          {uniqueAreas.map(area => <option key={area} value={area}>{area}</option>)}
                          {!uniqueAreas.length && <option value="">No areas</option>}
                        </select>
                      </div>

                      {/* Venue */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Venue</label>
                        <select 
                          value={selectedClub} 
                          onChange={(e) => setSelectedClub(e.target.value)}
                          disabled={!availableVenues.length}
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 text-sm"
                        >
                          {availableVenues.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          {!availableVenues.length && <option value="">No venues</option>}
                        </select>
                      </div>
                    </div>

                    {/* Guest Slots */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Number of Guest Slots</label>
                      <input type="number" min="2" max="20" defaultValue="5" className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    {/* Terms */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="mt-1 w-5 h-5 accent-amber-500"
                        />
                        <span className="text-sm text-amber-100/80 leading-relaxed">
                          I agree to take full responsibility for pick-up/drop services, VIP table bookings, and all expenses. Any misbehavior will lead to permanent platform expulsion.
                        </span>
                      </label>
                    </div>

                    <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
                      Proceed to Payment & KYC
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
