"use client";

import React, { useEffect, useState } from "react";
import { deleteReview } from "@/services/adminModerationService";
import { getReviewsMock } from "@/lib/mock/reviewMock";
import ReviewModeration from "./ReviewModeration";
import { ShieldCheck, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview ModerationPanel
 * High-fidelity command module for platform safety and content moderation.
 */
export default function ModerationPanel() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate ledger sync
      await new Promise(resolve => setTimeout(resolve, 500));
      setReviews(getReviewsMock());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id);
      toast({
        title: "Content Redacted",
        description: "The professional testimonial has been removed from the network dossiers.",
      });
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Redaction Error",
        description: "Unable to synchronize changes with the reputation ledger.",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl italic text-white flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-accent" /> Security Command
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">Audit and moderate global network interactions.</p>
        </div>
        <div className="flex gap-2">
          <button className="glass-panel px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors border-white/5 flex items-center gap-2">
            <Filter className="w-3 h-3" /> Filter Signals
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 glass-panel rounded-3xl border-white/5">
          <Loader2 className="w-10 h-10 animate-spin text-accent opacity-50" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Security Ledgers...</p>
        </div>
      ) : (
        <ReviewModeration
          reviews={reviews}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
