"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, FileText, IndianRupee, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview BookingList
 * Comprehensive chronological ledger of all network engagements.
 */
export default function BookingList({ bookings }: { bookings: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {bookings.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-white/5">
          <p className="text-sm italic text-muted-foreground uppercase tracking-widest">Engagement ledger is currently empty.</p>
        </div>
      ) : (
        bookings.map((b) => (
          <Card key={b.id} className="glass-panel border-white/5 executive-card group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg italic text-white">Engagement ID: {b.id.slice(-8)}</h4>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><CalendarClock className="w-3 h-3 text-accent" /> {b.date} • {b.time}</span>
                      <span className="flex items-center gap-1.5 text-emerald-400"><IndianRupee className="w-3 h-3" /> 5,000</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <Badge 
                    variant="outline"
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      b.status === "confirmed" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : b.status === "cancelled"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {b.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-accent hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest">
                    Audit <ChevronRight className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
