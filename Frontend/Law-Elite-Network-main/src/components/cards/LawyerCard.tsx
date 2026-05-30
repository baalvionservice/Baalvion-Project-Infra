"use client";

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Briefcase, IndianRupee, MapPin, ShieldCheck, ChevronRight, CheckCircle2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface LawyerCardProps {
  lawyer: {
    id: string;
    name: string;
    specialization: string | string[];
    experience: number;
    consultationFee: number;
    displayRate?: string;
    currency?: string;
    available?: boolean;
    rating: number;
    city?: string;
    location?: string;
    profileImage?: string;
    isVerified?: boolean;
    totalReviews?: number;
    matchScore?: number;
    isBestMatch?: boolean;
  };
}

/**
 * @fileOverview LawyerCard
 * High-fidelity preview component for the elite counsel marketplace.
 * Fixed contrast for light Bank-Grade UI backgrounds.
 */
function LawyerCardComponent({ lawyer }: LawyerCardProps) {
  const router = useRouter();

  const specs = Array.isArray(lawyer.specialization) 
    ? lawyer.specialization 
    : [lawyer.specialization];

  const city = lawyer.city || lawyer.location || 'Global';

  return (
    <Card className={`bg-white border-slate-200 executive-card group overflow-hidden animate-in fade-in duration-500 shadow-lg relative ${lawyer.isBestMatch ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      {lawyer.isBestMatch && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-blue-600 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-lg flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 fill-white" /> Best Match
          </div>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center gap-4 pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="relative w-16 h-16 shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 group-hover:border-blue-400 transition-all duration-500 shadow-inner">
            <Image 
              src={lawyer.profileImage || `https://picsum.photos/seed/${lawyer.id}/200/200`} 
              alt={lawyer.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              data-ai-hint="lawyer portrait"
            />
          </div>
          {lawyer.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-lg">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="font-headline text-xl italic group-hover:text-blue-600 transition-colors duration-300 truncate text-slate-900">
              {lawyer.name}
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-blue-600 text-[10px] mt-1 font-bold uppercase tracking-widest">
              <Star className="w-3 h-3 fill-blue-600" />
              <span>{lawyer.rating.toFixed(1)}</span>
              <span className="text-slate-400 ml-1 font-medium italic">• ({lawyer.totalReviews || 0} reviews)</span>
            </div>
            {lawyer.matchScore && (
              <span className="text-[8px] font-bold text-blue-600/60 uppercase tracking-tighter">Match: {lawyer.matchScore}</span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {specs.slice(0, 3).map(s => (
            <Badge key={s} variant="outline" className="bg-slate-50 border-slate-200 text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-md font-bold text-slate-600">
              {s}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600 opacity-50" />
              {city}
            </div>
            <div className="flex items-center text-slate-500">
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-600 opacity-50" />
              {lawyer.experience}Y EXPERIENCE
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="space-y-0.5">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Consultation Fee</p>
              <div className="flex items-center text-slate-900">
                <span className="font-headline text-xl italic">{lawyer.displayRate || `$${(lawyer.consultationFee || 0).toLocaleString()}`}</span>
                <span className="text-[9px] text-slate-400 ml-1 uppercase tracking-tighter">/ hr</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-[#0B1F3A] text-white hover:bg-slate-800 h-10 px-5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                onClick={() => router.push(`/lawyer/${lawyer.id}`)}
              >
                View Dossier <ChevronRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(LawyerCardComponent);
