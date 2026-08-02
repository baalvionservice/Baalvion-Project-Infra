"use client";

import React, { useState } from "react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

type SubmissionState = "idle" | "loading" | "success" | "error";

export function NewsletterSignupRefactored() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setState("error");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setState("success");
        setEmail("");
        setMessage(data.message || "You're subscribed. Check your inbox for confirmation.");
        setTimeout(() => {
          setState("idle");
          setMessage("");
        }, 5000);
      } else {
        setState("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again later.");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Newsletter
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Weekly Market Briefing
            </h2>

            <p className="text-muted-foreground mb-4">
              Get our expert analysis, market trends, and investment opportunities delivered to
              your inbox every Thursday morning.
            </p>

            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                Curated market insights from financial experts
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                Week's most important economic indicators
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                Investment strategies and sector analysis
              </li>
            </ul>

            <p className="text-xs text-muted-foreground">
              We respect your privacy. Unsubscribe anytime.{" "}
              <a
                href="/privacy-policy"
                className="text-primary hover:text-primary/80 underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Right: Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                placeholder="you@example.com"
                required
                disabled={state === "loading" || state === "success"}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Email address"
              />
            </div>

            <button
              type="submit"
              disabled={state === "loading" || state === "success"}
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {state === "loading" && (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Subscribing...
                </>
              )}
              {state === "success" && (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Subscribed!
                </>
              )}
              {state === "idle" || state === "error" && "Subscribe Now"}
            </button>

            {/* Feedback Message */}
            {message && (
              <div
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  state === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                }`}
                role="alert"
              >
                {state === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                {state === "success" && <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                <span>{message}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              No spam, ever. Unsubscribe with one click.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSignupRefactored;
