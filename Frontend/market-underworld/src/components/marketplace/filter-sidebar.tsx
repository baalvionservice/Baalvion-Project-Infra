
"use client"

import React, { useState } from 'react';
import { REGIONS, COUNTRIES, STATES, CITIES } from '@/lib/location-data';
import { Search, Globe, Star, Zap, DollarSign, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void;
}

export const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [rating, setRating] = useState(0);
  const [priceRange, setPriceRange] = useState(500);
  const [isLive, setIsLive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const countries = COUNTRIES.filter(c => selectedRegion === 'all' || c.regionId === selectedRegion);
  const states = selectedCountry !== 'all' ? STATES[selectedCountry] || [] : [];
  const cities = selectedState !== 'all' ? CITIES[selectedState] || [] : [];

  const handleApply = () => {
    onFilterChange({
      region: selectedRegion,
      country: selectedCountry,
      state: selectedState,
      city: selectedCity,
      rating,
      maxPrice: priceRange,
      isLive,
      isVerified
    });
  };

  return (
    <div className="w-72 shrink-0 space-y-10">
      <div className="flex items-center gap-2 text-brand-green font-bold text-xs uppercase tracking-widest px-2">
        <Filter className="w-4 h-4" /> Operational Filters
      </div>

      <div className="space-y-8">
        {/* Geographic Node */}
        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Geographic Node</label>
          <div className="space-y-3">
            <div className="relative">
              <select 
                className="w-full bg-[#111318] border border-white/10 h-11 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-brand-green/50 appearance-none"
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCountry('all'); }}
              >
                <option value="all" className="bg-[#111318] text-white">All Regions</option>
                {REGIONS.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#111318] text-white">
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                className="w-full bg-[#111318] border border-white/10 h-11 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-brand-green/50 disabled:opacity-30 transition-opacity appearance-none"
                disabled={selectedRegion === 'all'}
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setSelectedState('all'); }}
              >
                <option value="all" className="bg-[#111318] text-white">All Countries</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#111318] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>

            {selectedCountry !== 'all' && states.length > 0 && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <select 
                  className="w-full bg-[#111318] border border-white/10 h-11 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-brand-green/50 appearance-none"
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setSelectedCity('all'); }}
                >
                  <option value="all" className="bg-[#111318] text-white">All States/Provinces</option>
                  {states.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#111318] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            )}

            {selectedState !== 'all' && cities.length > 0 && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <select 
                  className="w-full bg-[#111318] border border-white/10 h-11 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-brand-green/50 appearance-none"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="all" className="bg-[#111318] text-white">All Cities</option>
                  {cities.map(c => (
                    <option key={c} value={c} className="bg-[#111318] text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>
        </section>

        {/* Pricing Protocol */}
        <section className="space-y-4 px-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pricing Protocol</label>
            <span className="text-xs font-bold text-brand-green">${priceRange}/hr</span>
          </div>
          <input 
            type="range" 
            min="0" max="500" step="10"
            value={priceRange}
            onChange={(e) => setPriceRange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-brand-green cursor-pointer"
          />
        </section>

        {/* Requirements */}
        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">System Requirements</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">Live Now</span>
              </div>
              <input type="checkbox" checked={isLive} onChange={() => setIsLive(!isLive)} className="accent-red-500 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">Verified Only</span>
              </div>
              <input type="checkbox" checked={isVerified} onChange={() => setIsVerified(!isVerified)} className="accent-brand-green w-4 h-4" />
            </label>
          </div>
        </section>

        <button 
          onClick={handleApply}
          className="w-full h-12 nexus-gradient-bg text-black font-bold uppercase tracking-widest text-[11px] rounded-xl shadow-xl hover:scale-[1.02] transition-all"
        >
          Initialize Filters
        </button>
      </div>
    </div>
  );
};
