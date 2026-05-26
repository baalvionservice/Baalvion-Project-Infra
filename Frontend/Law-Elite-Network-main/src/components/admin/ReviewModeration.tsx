"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, ShieldAlert, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewModerationProps {
  reviews: any[];
  onDelete: (id: string) => void;
}

/**
 * @fileOverview ReviewModeration
 * Specialized administrative interface for auditing practitioner testimonials.
 */
export default function ReviewModeration({ reviews, onDelete }: ReviewModerationProps) {
  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center glass-panel rounded-3xl border-white/5 bg-white/[0.01]">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm italic text-muted-foreground uppercase tracking-widest">Reputation ledger is currently clear.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
          <Star className="w-3 h-3" /> Professional Feedback Audit
        </h3>
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{reviews.length} Entries Identified</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((r) => (
          <Card key={r.id} className="glass-panel border-white/5 executive-card group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white italic">{r.userName || "Elite Member"}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                          {formatDistanceToNow(r.createdAt)} ago • ID: {r.id.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= r.rating ? "fill-accent text-accent" : "text-white/10"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="pl-11">
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{r.comment}"
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (confirm("Confirm redaction of this testimonial? This action is irreversible.")) {
                        onDelete(r.id);
                      }
                    }}
                    className="text-red-400 hover:text-white hover:bg-red-500/20 text-[9px] font-bold uppercase tracking-widest h-9 px-4 rounded-xl border border-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Redact Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
