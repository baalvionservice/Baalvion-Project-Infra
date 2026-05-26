"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Briefcase, 
  Award, 
  IndianRupee, 
  ShieldCheck, 
  RotateCcw,
  Search
} from "lucide-react";

interface FilterPanelProps {
  onApply: (filters: any) => void;
}

/**
 * @fileOverview FilterPanel
 * High-fidelity suite for refining practitioner discovery.
 */
export default function FilterPanel({ onApply }: FilterPanelProps) {
  const [filters, setFilters] = useState<any>({
    specialization: "",
    minExperience: "",
    maxFee: "",
    availability: false,
  });

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      specialization: "",
      minExperience: "",
      maxFee: "",
      availability: false,
    };
    setFilters(resetFilters);
    onApply(resetFilters);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 shadow-2xl space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
          <Search className="w-3 h-3" /> Discovery Refinement
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white h-auto p-0"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Domain Expertise</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input 
              placeholder="e.g. Corporate" 
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="glass-panel border-white/10 h-10 pl-10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Min Experience (Years)</Label>
          <div className="relative">
            <Award className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input 
              type="number"
              placeholder="e.g. 10" 
              value={filters.minExperience}
              onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
              className="glass-panel border-white/10 h-10 pl-10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Max Fee (INR)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input 
              type="number"
              placeholder="e.g. 5000" 
              value={filters.maxFee}
              onChange={(e) => setFilters({ ...filters, maxFee: e.target.value })}
              className="glass-panel border-white/10 h-10 pl-10 text-xs"
            />
          </div>
        </div>

        <div className="flex items-end pb-1">
          <div className="glass-panel px-4 h-10 rounded-xl border-accent/20 bg-accent/5 flex items-center justify-between w-full">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-white">Available Now</Label>
            <Switch 
              checked={filters.availability} 
              onCheckedChange={(checked) => setFilters({ ...filters, availability: checked })}
              className="data-[state=checked]:bg-accent scale-75"
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleApply}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/10 transition-all active:scale-[0.98]"
      >
        <ShieldCheck className="w-4 h-4 mr-2" /> Apply Intelligence Filters
      </Button>
    </div>
  );
}
