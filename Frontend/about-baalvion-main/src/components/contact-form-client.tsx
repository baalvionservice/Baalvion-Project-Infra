"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Client-side contact form component
 * Handles form submission and user interactions
 */
export default function ContactFormClient() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      toast({
        title: "Baalvion Operating System (BOS) Link Established",
        description:
          "Your strategic inquiry has been registered in the secure buffer.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast({
        title: "Link Error",
        description:
          "Could not establish Baalvion Operating System (BOS) link. Please check your network protocol.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 sm:p-8 md:p-10 lg:p-16 border-primary/20 shadow-2xl relative animate-fade-in stagger-2">
      <div className="absolute -top-3 sm:-top-4 left-6 sm:left-10">
        <Badge className="bg-primary text-white py-1.5 px-4 sm:px-6 rounded-full font-bold shadow-xl text-[8px] sm:text-[10px] tracking-widest uppercase">
          Secure Link Terminal
        </Badge>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2 group">
            <label className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
              Identity Designation
            </label>
            <Input
              name="name"
              required
              placeholder="Full Name"
              className="bg-white/5 border-white/10 h-12 sm:h-14 rounded-xl px-4 sm:px-6 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm sm:text-base transition-all"
            />
          </div>
          <div className="space-y-2 group">
            <label className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
              Secure Email
            </label>
            <Input
              name="email"
              type="email"
              required
              placeholder="Secure Address"
              className="bg-white/5 border-white/10 h-12 sm:h-14 rounded-xl px-4 sm:px-6 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm sm:text-base transition-all"
            />
          </div>
        </div>
        <div className="space-y-2 group">
          <label className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
            Strategic Objective
          </label>
          <Input
            name="subject"
            required
            placeholder="e.g. Infrastructure Integration"
            className="bg-white/5 border-white/10 h-12 sm:h-14 rounded-xl px-4 sm:px-6 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm sm:text-base transition-all"
          />
        </div>
        <div className="space-y-2 group">
          <label className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
            Operational Brief
          </label>
          <Textarea
            name="message"
            required
            placeholder="How can we architect the future together?"
            className="bg-white/5 border-white/10 min-h-[140px] sm:min-h-[180px] rounded-xl sm:rounded-2xl p-4 sm:p-6 focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none text-sm sm:text-base leading-relaxed transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold group"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />{" "}
              Establishing Link...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              Establish Baalvion Operating System (BOS) Link{" "}
              <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </span>
          )}
        </Button>
        <div className="flex items-center justify-center gap-3 text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
          <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Encryption
          ACTIVE • AES-256
        </div>
      </form>
    </div>
  );
}
