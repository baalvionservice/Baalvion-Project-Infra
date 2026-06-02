"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Globe
} from 'lucide-react';
import LawyerCard from '@/components/cards/LawyerCard';
import { searchLawyers, getAllLawyers, getCountries } from '@/services/lawyers/lawyerService';
import LawyerAutocomplete from '@/components/search/LawyerAutocomplete';
import { getCaseById } from '@/services/cases/caseService';
import { rankLawyersForCase } from '@/services/matching/matchingService';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @fileOverview Lawyer Marketplace
 * Premium discovery engine for elite practitioners.
 * Fixed visibility issues for light-theme Bank-Grade UI.
 */
export default function LawyerMarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <LawyerMarketplaceContent />
    </Suspense>
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
  const [filters, setFilters] = useState({
    specialization: 'all',
    minRating: 'all',
    maxPrice: 'all',
    countryCode: 'all',
  });

  // Load the real "browse by country" index once.
  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

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
    const reset = { specialization: 'all', minRating: 'all', maxPrice: 'all', countryCode: 'all' };
    setFilters(reset);
    fetchLawyers(reset);
  };

  const selectCountry = (cc: string) => {
    setFilters((f) => ({ ...f, countryCode: cc }));
    fetchLawyers({ countryCode: cc });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex justify-center mb-4">
             <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-blue-500/5">
               <Award className="w-3.5 h-3.5" />
               Verified Global Network
             </span>
          </div>
          <h1 className="font-headline text-5xl md:text-6xl mb-4 italic text-slate-900">Discover Elite Counsel</h1>
          <p className="text-slate-500 max-w-2xl mx-auto italic font-medium">Access a curated network of the world's most distinguished, verified legal practitioners.</p>
          
          {activeCase && (
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 animate-in zoom-in duration-500">
              <Gavel className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Optimizing for: {activeCase.title}</span>
              <Sparkles className="w-3 h-3 animate-pulse" />
            </div>
          )}
        </header>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <Select value={filters.specialization} onValueChange={(val) => setFilters({...filters, specialization: val})}>
              <SelectTrigger className="border-slate-200 h-11 text-[10px] uppercase font-bold tracking-widest bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                  <SelectValue placeholder="Legal Domain" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All Domains</SelectItem>
                <SelectItem value="Corporate">Corporate Law</SelectItem>
                <SelectItem value="Criminal">Criminal Defense</SelectItem>
                <SelectItem value="IP">Intellectual Property</SelectItem>
                <SelectItem value="Arbitration">Arbitration</SelectItem>
                <SelectItem value="Tax">Tax Compliance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.minRating} onValueChange={(val) => setFilters({...filters, minRating: val})}>
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

            <Select value={filters.maxPrice} onValueChange={(val) => setFilters({...filters, maxPrice: val})}>
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

            <Button 
              variant="outline" 
              onClick={handleReset}
              className="h-11 border-slate-200 hover:bg-slate-50 text-[10px] uppercase font-bold tracking-widest text-slate-500"
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
      </main>
    </div>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <Skeleton className="h-4 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[320px] rounded-3xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
