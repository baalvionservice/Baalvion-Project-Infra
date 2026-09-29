"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarCheck, ChevronRight, IndianRupee } from 'lucide-react';

interface StickyBookingBarProps {
  fee: number;
  available: boolean;
  onBook: () => void;
}

/**
 * @fileOverview StickyBookingBar
 * Persistent executive call-to-action for mobile and responsive views.
 */
export default function StickyBookingBar({ fee, available, onBook }: StickyBookingBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-500">
      <div className="glass-panel border-t border-white/10 p-4 pb-8 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.5)]">
        <div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Consultation Fee</p>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-headline text-xl italic text-white">{fee.toLocaleString()}</span>
          </div>
        </div>

        <Button 
          disabled={!available}
          onClick={onBook}
          className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6 h-12 font-bold shadow-lg shadow-accent/20"
        >
          {available ? (
            <>
              COMMIT SESSION <ChevronRight className="ml-1 w-4 h-4" />
            </>
          ) : (
            "IN CHAMBERS"
          )}
        </Button>
      </div>
    </div>
  );
}
