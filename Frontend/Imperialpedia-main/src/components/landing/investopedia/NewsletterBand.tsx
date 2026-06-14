"use client";

import React, { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Newsletter capture band — the Investopedia "Sign up for our newsletter"
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
        setMessage("You're subscribed. Check your inbox for confirmation.");
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
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest">
              <Mail className="h-4 w-4" /> Newsletter
            </div>
            <h2 className="mt-2 text-3xl font-black leading-tight text-background">
              The market, decoded — every morning.
            </h2>
            <p className="mt-2 text-sm text-background/70 max-w-md">
              Join investors getting Imperialpedia&apos;s daily briefing: the moves that matter,
              explained in plain English. Free, no spam.
            </p>
          </div>

          <div>
            {status === "success" ? (
              <div className="flex items-center gap-3 bg-background/10 border border-background/20 px-5 py-4">
                <Check className="h-6 w-6 text-accent flex-shrink-0" />
                <p className="text-sm text-background">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="flex-1 h-12 px-4 rounded-sm bg-background text-foreground placeholder:text-muted-foreground border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-12 px-6 rounded-sm bg-accent text-accent-foreground font-bold hover:brightness-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 text-sm text-accent">{message}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewsletterBand;
