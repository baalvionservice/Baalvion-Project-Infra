"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  Users,
  Lock,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ContactClient() {
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-24 lg:pb-32">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-start">
            <div className="space-y-12 sm:space-y-16 animate-fade-in">
              <div className="space-y-4 sm:space-y-6">
                <span className="section-label">Strategic Communications</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary tracking-tighter leading-tight">
                  Establish <br />
                  <span className="gradient-text">
                    Baalvion Operating System (BOS) Link
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Initiate a strategic partnership or project briefing. Our
                  global trade specialists are ready to architect your
                  integration.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {[
                  {
                    icon: Mail,
                    value: "intel@baalvion.nexus",
                    label: "Email Protocol",
                  },
                  {
                    icon: MapPin,
                    value: "New Delhi, NCR, IN",
                    label: "Physical Node",
                  },
                  {
                    icon: ShieldCheck,
                    value: "PGP: BAAL-2024-NX",
                    label: "Encryption Key",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-4 sm:gap-6 items-center p-6 sm:p-8 glass-card border-white/5 card-hover group opacity-0 animate-fade-in fill-mode-forwards",
                      i === 0
                        ? "stagger-1"
                        : i === 1
                        ? "stagger-2"
                        : "stagger-3"
                    )}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500 text-primary group-hover:text-white border border-primary/10">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">
                        {item.label}
                      </p>
                      <h4 className="text-white font-bold text-base sm:text-lg">
                        {item.value}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl bg-primary/[0.02] border border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent animate-pulse" />
                    <h4 className="text-white font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">
                      Response Protocol
                    </h4>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic font-light">
                    "Our strategic response team typically reviews all inbound
                    Baalvion Operating System (BOS) links within 4-6 operational
                    hours. Global trade never sleeps."
                  </p>
                </div>
              </div>
            </div>

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
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />{" "}
                  Encryption ACTIVE • AES-256
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
