"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: {
    id: string;
    date: string;
    time: string;
    status: string;
  };
}

/**
 * @fileOverview BookingCard
 * Professional preview component for consultation engagements.
 * Enhanced with interactive hover states and tactile scale feedback.
 */
export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="executive-card overflow-hidden group cursor-pointer active:scale-[0.99] transition-all duration-300"
      onClick={() => router.push(`/booking-details/${booking.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="font-headline text-lg italic text-slate-900 group-hover:text-blue-700 transition-colors">Consultation Engagement</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {booking.id.slice(-8)}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(booking.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                  <Clock className="w-3.5 h-3.5" /> {booking.time}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
            <Badge 
              variant="outline"
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors duration-500 ${
                booking.status === "confirmed" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white" 
                  : booking.status === "cancelled"
                  ? "bg-red-50 text-red-700 border-red-100 group-hover:bg-red-600 group-hover:text-white"
                  : "bg-amber-50 text-amber-700 border-amber-100 group-hover:bg-amber-600 group-hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${booking.status === "confirmed" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
              {booking.status}
            </Badge>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
