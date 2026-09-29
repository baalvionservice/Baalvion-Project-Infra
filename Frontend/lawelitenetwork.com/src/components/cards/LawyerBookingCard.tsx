"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ChevronRight, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LawyerBookingCardProps {
  booking: {
    id: string;
    date: string;
    time: string;
    status: string;
    userId: string;
  };
}

/**
 * @fileOverview LawyerBookingCard
 * Professional engagement preview for practitioner dashboards.
 */
export default function LawyerBookingCard({ booking }: LawyerBookingCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="glass-panel border-white/5 executive-card overflow-hidden group cursor-pointer"
      onClick={() => router.push(`/booking-details/${booking.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-headline text-lg italic text-white">Client Engagement</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Reference ID: {booking.id.slice(-8)}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5 text-accent" /> {new Date(booking.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 text-accent" /> {booking.time}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            <Badge 
              variant="outline"
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                booking.status === "confirmed" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : booking.status === "cancelled"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${booking.status === "confirmed" ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
              {booking.status}
            </Badge>
            <Button variant="ghost" size="sm" className="text-accent hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest group">
              Audit Dossier <ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
