"use client";

import React, { useState } from "react";
import { addReview } from "@/services/reviewService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, Loader2, ShieldCheck } from "lucide-react";

interface ReviewFormProps {
  lawyerId: string;
  user: any;
  onSuccess: () => void;
}

/**
 * @fileOverview ReviewForm
 * High-fidelity feedback component for elite clients.
 */
export default function ReviewForm({ lawyerId, user, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addReview({
        id: `rev_${Date.now()}`,
        lawyerId,
        userId: user.id,
        userName: user.name || "Elite Member",
        rating,
        comment,
        createdAt: Date.now(),
      });

      toast({
        title: "Feedback Synchronized",
        description: "Your testimonial has been verified and added to the practitioner's dossier.",
      });
      
      setComment("");
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Unable to sync feedback. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02] space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          <Star className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Provide Testimonial</h3>
          <p className="text-[10px] text-muted-foreground uppercase italic">Your feedback maintains network integrity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoveredRating || rating) >= star 
                      ? "fill-accent text-accent" 
                      : "text-white/10"
                  } transition-colors duration-200`} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="comment" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Case Experience</Label>
          <Textarea
            id="comment"
            placeholder="Describe your professional engagement with this practitioner..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="glass-panel border-white/10 min-h-[100px] text-sm italic"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !comment.trim()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold rounded-xl shadow-lg shadow-accent/10"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              SYNCHRONIZING...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              COMMIT TESTIMONIAL
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 opacity-40">
          <ShieldCheck className="w-3 h-3" />
          <p className="text-[8px] font-bold uppercase tracking-widest">Verified Client Feedback Protocol</p>
        </div>
      </form>
    </div>
  );
}
