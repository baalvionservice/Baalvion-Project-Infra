"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview LawyerList
 * Specialized administrative view for practitioner oversight.
 */
export default function LawyerList({ lawyers }: { lawyers: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {lawyers.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-white/5">
          <p className="text-sm italic text-muted-foreground uppercase tracking-widest">No practitioners in active marketplace.</p>
        </div>
      ) : (
        lawyers.map((l) => (
          <Card key={l.id} className="glass-panel border-white/5 executive-card group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline text-lg italic text-white">{l.name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-0.5">{l.specialization}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Network Rating</p>
                    <div className="flex items-center gap-1 justify-end text-accent mt-0.5">
                      <Star className="w-3 h-3 fill-accent" />
                      <span className="text-sm font-bold">{l.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest h-9 px-4 rounded-xl">
                    Audit Profile
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
