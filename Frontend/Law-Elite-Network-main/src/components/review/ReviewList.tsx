"use client";

import React from "react";
import { Review } from "@/types/review";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
  reviews: Review[];
}

/**
 * @fileOverview ReviewList
 * Structured display of practitioner testimonials.
 */
export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center glass-panel rounded-3xl border-white/5 border-dashed bg-white/[0.01]">
        <MessageSquare className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
        <p className="text-sm italic text-muted-foreground uppercase tracking-widest">No testimonials verified for this dossier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-xl italic text-white">Client Testimonials</h3>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{reviews.length} Verified Entries</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((r) => (
          <div 
            key={r.id} 
            className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group animate-in fade-in duration-500"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-accent/10 text-accent font-bold italic text-xs">
                    {r.userName?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-accent transition-colors">{r.userName || "Elite Member"}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Verified Client • {formatDistanceToNow(r.createdAt)} ago</p>
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
            
            <div className="mt-4 pl-13">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{r.comment}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
