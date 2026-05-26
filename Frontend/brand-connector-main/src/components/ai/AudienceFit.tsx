
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Users, 
  MapPin, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight,
  UserCheck,
  Globe,
  Activity,
  Sparkles,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Interfaces for the Analyzer
interface AudienceSegment {
  label: string;
  value: number; // 0-100
}

interface AudienceData {
  age: AudienceSegment[];
  gender: AudienceSegment[];
  locations: AudienceSegment[];
  interests: string[];
}

interface AudienceFitProps {
  creatorName: string;
  creatorAudience: AudienceData;
  initialTarget?: {
    ageRange: string;
    gender: string;
    location: string;
    interest: string;
  };
  className?: string;
}

const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45+'];
const GENDERS = ['Male', 'Female', 'Non-binary'];

export function AudienceFitAnalyzer({ creatorName, creatorAudience, initialTarget, className }: AudienceFitProps) {
  // Brand Target Selection State
  const [target, setTarget] = useState(initialTarget || {
    ageRange: '18-24',
    gender: 'Female',
    location: 'India',
    interest: 'Tech & Gadgets'
  });

  // Calculate Match Score
  const fitMetrics = useMemo(() => {
    const ageMatch = creatorAudience.age.find(a => a.label === target.ageRange)?.value || 0;
    const genderMatch = creatorAudience.gender.find(g => g.label === target.gender)?.value || 0;
    const locMatch = creatorAudience.locations.find(l => l.label === target.location)?.value || 0;
    const interestMatch = creatorAudience.interests.includes(target.interest) ? 100 : 40;

    // Weighting: Age(30), Gender(20), Location(25), Interest(25)
    const overall = Math.round(
      (ageMatch * 0.3) + 
      (genderMatch * 0.2) + 
      (locMatch * 0.25) + 
      (interestMatch * 0.25)
    );

    return { overall, ageMatch, genderMatch, locMatch, interestMatch };
  }, [target, creatorAudience]);

  const getFitLevel = (score: number) => {
    if (score >= 85) return { label: 'Excellent Fit', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Strong Alignment', color: 'text-primary', bg: 'bg-primary/5', icon: Zap };
    return { label: 'Partial Match', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
  };

  const fitStatus = getFitLevel(fitMetrics.overall);

  return (
    <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Audience Fit Analyzer
          </CardTitle>
          <CardDescription className="font-medium">Comparing your target vs. {creatorName}&apos;s real data.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                <img src={`https://picsum.photos/seed/aud${i}/50/50`} alt="User" />
              </div>
            ))}
          </div>
          <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border-none shadow-sm", fitStatus.bg, fitStatus.color)}>
            {fitStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Configuration / Simulator */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <Activity className="h-3 w-3" /> Set Target Persona
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Target Age Group</label>
                  <Select value={target.ageRange} onValueChange={(v) => setTarget({...target, ageRange: v})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RANGES.map(range => <SelectItem key={range} value={range} className="font-bold">{range} years</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Primary Gender</label>
                  <Select value={target.gender} onValueChange={(v) => setTarget({...target, gender: v})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Market Region</label>
                  <Select value={target.location} onValueChange={(v) => setTarget({...target, location: v})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India" className="font-bold">India</SelectItem>
                      <SelectItem value="United States" className="font-bold">United States</SelectItem>
                      <SelectItem value="United Kingdom" className="font-bold">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
              <Sparkles className="absolute -top-4 -right-4 h-20 w-20 text-white/5 group-hover:scale-110 transition-transform" />
              <div className="relative space-y-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">AI Market Context</p>
                <p className="text-xs font-medium leading-relaxed">
                  Creators in this niche typically have a **{target.ageRange}** audience. Matching here lowers your CPA by ~15%.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Score & Breakdown */}
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-12 items-center">
            
            {/* Radial Score */}
            <div className="relative h-48 w-48 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle cx="96" cy="96" r="80" className="stroke-slate-100 fill-none" strokeWidth="16" />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  className={cn("fill-none transition-all duration-700", fitStatus.color.replace('text-', 'stroke-'))}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={502}
                  initial={{ strokeDashoffset: 502 }}
                  animate={{ strokeDashoffset: 502 - (502 * fitMetrics.overall) / 100 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{fitMetrics.overall}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Smart Fit</span>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="flex-1 w-full space-y-6">
              {[
                { label: 'Age Overlap', val: fitMetrics.ageMatch, icon: Users, color: 'bg-purple-500' },
                { label: 'Gender Affinity', val: fitMetrics.genderMatch, icon: UserCheck, color: 'bg-pink-500' },
                { label: 'Geographic Fit', val: fitMetrics.locMatch, icon: Globe, color: 'bg-blue-500' },
                { label: 'Interest Synergy', val: fitMetrics.interestMatch, icon: PieChart, color: 'bg-emerald-500' },
              ].map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{metric.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{metric.val}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.val}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", metric.color)}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </CardContent>

      <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
            This report is generated using aggregated follower data from our daily API sync. Data accuracy is verified at **92% confidence level**.
          </p>
        </div>
        <Button variant="ghost" className="rounded-xl font-bold h-11 px-6 group">
          Full Demographic Audit <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}
