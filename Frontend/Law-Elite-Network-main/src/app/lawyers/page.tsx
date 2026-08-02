"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  Loader2,
  Award,
  FilterX,
  Sparkles,
  Gavel,
  Globe,
  MapPin,
  BadgeCheck,
  Radio,
} from 'lucide-react';
import LawyerCard from '@/components/cards/LawyerCard';
import { searchLawyers, getAllLawyers, getCountries } from '@/services/lawyers/lawyerService';
import LawyerAutocomplete from '@/components/search/LawyerAutocomplete';
import { getCaseById } from '@/services/cases/caseService';
import { rankLawyersForCase } from '@/services/matching/matchingService';
import { Skeleton } from '@/components/ui/skeleton';
import { getStates, getCities, type GeoState, type GeoCity } from '@/services/geo/geoService';
import { getPracticeAreas, type PracticeArea } from '@/services/practiceAreas/practiceAreaService';

/**
 * @fileOverview Lawyer Marketplace
 * Premium discovery engine for elite practitioners.
 * Fixed visibility issues for light-theme Bank-Grade UI.
 */
export default function LawyerMarketplacePage() {
  // Gated until the directory has real, verified attorney data — the lawyer
  // count is 0 across every country right now, so this was just an empty
  // "0 results" search UI reachable from nav. Pulled from nav/sitemap/robots
  // too (see PublicNavbar, PublicFooter, homepage, sitemap.ts, robots.ts).
  // Remove this notFound() + restore those links once populated.
  notFound();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Static intro — kept outside the Suspense boundary below so the H1 and
            copy are always part of the first response. LawyerMarketplaceContent
            calls useSearchParams(), which forces its own Suspense boundary to
            fall back to MarketplaceSkeleton in the prerendered shell; nesting
            everything under that boundary (the previous structure) meant
            crawlers only ever saw the loading skeleton, with no <h1> at all. */}
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex justify-center mb-4">
             <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-blue-500/5">
               <Award className="w-3.5 h-3.5" />
               Verified Global Network
             </span>
          </div>
          <h1 className="font-headline text-5xl md:text-6xl mb-4 italic text-slate-900">Discover Elite Counsel</h1>
          <p className="text-slate-500 max-w-2xl mx-auto italic font-medium">Access a curated network of the world's most distinguished, verified legal practitioners.</p>
        </header>

        <Suspense fallback={<MarketplaceSkeleton />}>
          <LawyerMarketplaceContent />
        </Suspense>
      </main>
    </div>
  );
}

function LawyerMarketplaceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState<{ country: string; countryCode: string; count: number }[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [filters, setFilters] = useState({
    specialization: 'all',
    minRating: 'all',
    maxPrice: 'all',
    countryCode: 'all',
    stateId: 'all',
    cityId: 'all',
    practiceAreaId: 'all',
    minExperience: 'all',
    language: 'all',
    verifiedOnly: false,
    onlineOnly: false,
  });

  // Load the real "browse by country" index once, plus the fixed practice-area list.
  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]));
    getPracticeAreas().then(setPracticeAreas).catch(() => setPracticeAreas([]));
  }, []);

  // Cascading State -> City, same pattern as the registration wizard.
  useEffect(() => {
    setFilters((f) => ({ ...f, stateId: 'all', cityId: 'all' }));
    setCities([]);
    if (!filters.countryCode || filters.countryCode === 'all') { setStates([]); return; }
    getStates(filters.countryCode).then(setStates).catch(() => setStates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.countryCode]);

  useEffect(() => {
    setFilters((f) => ({ ...f, cityId: 'all' }));
    if (!filters.stateId || filters.stateId === 'all') { setCities([]); return; }
    getCities(Number(filters.stateId)).then(setCities).catch(() => setCities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stateId]);

  const fetchLawyers = async (overrides: Partial<typeof filters> = {}) => {
    setLoading(true);
    try {
      // 1. Fetch case context if provided
      let caseContext = null;
      if (caseId) {
        caseContext = await getCaseById(caseId);
        setActiveCase(caseContext);
      }

      // 2. Fetch base lawyer list (overrides win over current state so chip/select
      //    selections apply immediately, without waiting for a state re-render).
      const f = { ...filters, ...overrides };
      const searchParams: any = { query: searchQuery };
      if (f.specialization !== 'all') searchParams.specialization = f.specialization;
      if (f.minRating !== 'all') searchParams.minRating = parseFloat(f.minRating);
      if (f.maxPrice !== 'all') searchParams.maxPrice = parseInt(f.maxPrice);
      if (f.countryCode !== 'all') searchParams.countryCode = f.countryCode;
      if (f.stateId !== 'all') searchParams.stateId = f.stateId;
      if (f.cityId !== 'all') searchParams.cityId = f.cityId;
      if (f.practiceAreaId !== 'all') searchParams.practiceAreaId = f.practiceAreaId;
      if (f.minExperience !== 'all') searchParams.minExperience = f.minExperience;
      if (f.language !== 'all') searchParams.language = f.language;
      if (f.verifiedOnly) searchParams.verifiedOnly = true;
      if (f.onlineOnly) searchParams.onlineOnly = true;

      let data = await searchLawyers(searchParams);

      // 3. Apply Match Ranking if case context exists
      if (caseContext) {
        data = await rankLawyersForCase(data, caseContext);
      }

      setLawyers(data);
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, [caseId]);

  const handleReset = () => {
    setSearchQuery('');
    const reset = {
      specialization: 'all', minRating: 'all', maxPrice: 'all', countryCode: 'all',
      stateId: 'all', cityId: 'all', practiceAreaId: 'all', minExperience: 'all',
      language: 'all', verifiedOnly: false, onlineOnly: false,
    };
    setFilters(reset);
    fetchLawyers(reset);
  };

  const selectCountry = (cc: string) => {
    setFilters((f) => ({ ...f, countryCode: cc, stateId: 'all', cityId: 'all' }));
    fetchLawyers({ countryCode: cc, stateId: 'all', cityId: 'all' });
  };

  return (
    <>
        {activeCase && (
          <div className="mb-12 -mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 animate-in zoom-in duration-500">
            <Gavel className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Optimizing for: {activeCase.title}</span>
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
        )}

        {/* Discovery Control Center */}
        <div className="bg-white p-6 rounded-3xl mb-12 space-y-6 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-20" />
          
          <div className="flex flex-col lg:flex-row gap-4">
            <LawyerAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={() => fetchLawyers()}
            />
            <Button
              onClick={() => fetchLawyers()}
              className="bg-[#0B1F3A] text-white hover:bg-slate-800 h-12 px-8 rounded-xl font-bold shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98]"
            >
              Update Discovery
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.countryCode} onValueChange={selectCountry}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-blue-600" />
                  <SelectValue placeholder="Country" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-72">
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.countryCode} value={c.countryCode}>{c.country} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.stateId}
              onValueChange={(val) => { setFilters((f) => ({ ...f, stateId: val, cityId: 'all' })); fetchLawyers({ stateId: val, cityId: 'all' }); }}
              disabled={!states.length}
            >
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <SelectValue placeholder={states.length ? 'State' : 'No state data yet'} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-72">
                <SelectItem value="all">All States</SelectItem>
                {states.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={filters.cityId}
              onValueChange={(val) => { setFilters((f) => ({ ...f, cityId: val })); fetchLawyers({ cityId: val }); }}
              disabled={!cities.length}
            >
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <SelectValue placeholder={cities.length ? 'City' : 'Select a state first'} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-72">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={filters.practiceAreaId}
              onValueChange={(val) => { setFilters((f) => ({ ...f, practiceAreaId: val })); fetchLawyers({ practiceAreaId: val }); }}
            >
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                  <SelectValue placeholder="Practice Area" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-72">
                <SelectItem value="all">All Practice Areas</SelectItem>
                {practiceAreas.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.minRating} onValueChange={(val) => { setFilters({ ...filters, minRating: val }); fetchLawyers({ minRating: val }); }}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <SelectValue placeholder="Min Rating" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.8">4.8+ Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.maxPrice} onValueChange={(val) => { setFilters({ ...filters, maxPrice: val }); fetchLawyers({ maxPrice: val }); }}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <SelectValue placeholder="Max Fee (INR)" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="5000">Up to ₹5,000</SelectItem>
                <SelectItem value="8000">Up to ₹8,000</SelectItem>
                <SelectItem value="12000">Up to ₹12,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.minExperience} onValueChange={(val) => { setFilters({ ...filters, minExperience: val }); fetchLawyers({ minExperience: val }); }}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">Any Experience</SelectItem>
                <SelectItem value="5">5+ Years</SelectItem>
                <SelectItem value="10">10+ Years</SelectItem>
                <SelectItem value="15">15+ Years</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.language} onValueChange={(val) => { setFilters({ ...filters, language: val }); fetchLawyers({ language: val }); }}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">Any Language</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
                <SelectItem value="Mandarin">Mandarin</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Portuguese">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { const v = !filters.verifiedOnly; setFilters((f) => ({ ...f, verifiedOnly: v })); fetchLawyers({ verifiedOnly: v }); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.verifiedOnly ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Verified Lawyers Only
            </button>
            <button
              onClick={() => { const v = !filters.onlineOnly; setFilters((f) => ({ ...f, onlineOnly: v })); fetchLawyers({ onlineOnly: v }); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.onlineOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
            >
              <Radio className="w-3.5 h-3.5" /> Online Now
            </button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-9 border-slate-200 hover:bg-slate-50 text-[10px] uppercase font-bold tracking-widest text-slate-500"
            >
              <FilterX className="w-3.5 h-3.5 mr-2" /> Reset Refinement
            </Button>
          </div>
        </div>

        {/* Browse by country — real active-lawyer counts across the global network */}
        {countries.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> Browse by Country
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectCountry('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.countryCode === 'all' ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                All Countries
              </button>
              {countries.map((c) => (
                <button
                  key={c.countryCode}
                  onClick={() => selectCountry(c.countryCode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.countryCode === c.countryCode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                >
                  {c.country} <span className="opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Ledger */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Intelligence Matches: {lawyers.length}
            </h2>
            <div className="h-px flex-1 bg-slate-200 mx-6 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[320px] rounded-3xl" />
                </div>
              ))
            ) : lawyers.length > 0 ? (
              lawyers.map((lawyer, index) => (
                <LawyerCard 
                  key={lawyer.id} 
                  lawyer={{
                    ...lawyer,
                    consultationFee: lawyer.hourlyRate || lawyer.consultationFee,
                    isBestMatch: activeCase && index === 0
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Search className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-headline italic mb-2 text-slate-900">No Elite Counsel Detected</h3>
                <p className="text-slate-500 max-w-xs mx-auto italic text-sm mb-8">
                  Platform intelligence could not locate a practitioner matching these specific refined criteria.
                </p>
                <Button 
                  onClick={handleReset}
                  className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Clear Discovery Filters
                </Button>
              </div>
            )}
          </div>
        </div>
    </>
  );
}

function MarketplaceSkeleton() {
  return (
    <>
      <div className="bg-white p-6 rounded-3xl mb-12 space-y-6 border border-slate-200 shadow-xl">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-[320px] rounded-3xl" />
        ))}
      </div>
    </>
  );
}
