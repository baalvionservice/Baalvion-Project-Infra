"use client";

import React, { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Newsletter capture band — the Imperialpedia "Sign up for our newsletter"
 * conversion strip. Posts to the existing /api/newsletter route.
 */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Thanks for signing up.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <section id="newsletter" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-black text-white border-4 border-black p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(200,16,46,1)] relative overflow-hidden rounded-xs">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-12">
                BREAKING BRIEFING
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ffcc00]">
                // DAILY MARKET INTELLIGENCE
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black uppercase font-serif tracking-tight text-white leading-none">
              THE MARKET, DECODED — <span className="text-[#ffcc00]">EVERY MORNING</span>.
            </h2>
            
            <p className="text-sm font-medium text-slate-300 max-w-md leading-relaxed">
              Join thousands of smart readers getting Imperialpedia level financial analysis: market moves, 
              economic stories, and wealth insights. Free, daily, zero spam.
            </p>
          </div>

          <div>
            {status === "success" ? (
              <div className="flex items-center gap-3 bg-white/10 border-2 border-[#ffcc00] px-5 py-4 text-[#ffcc00] font-mono text-sm font-bold">
                <Check className="h-6 w-6 shrink-0 text-[#ffcc00]" />
                <p>{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="flex-1 h-12 px-4 bg-white text-black font-mono font-bold text-sm placeholder:text-slate-500 border-2 border-white focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-12 px-6 bg-[#c8102e] text-white font-mono font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black border-2 border-white -skew-x-6 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> JOINING…
                    </>
                  ) : (
                    "SUBSCRIBE NOW →"
                  )}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 text-xs font-mono font-bold text-[#ffcc00]">{message}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
