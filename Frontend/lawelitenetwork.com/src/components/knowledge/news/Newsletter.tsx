"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

/** Newsletter capture band for the news homepage. Posts to /api/newsletter. */
export function Newsletter() {
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
        setMessage(data.message || "You're subscribed.");
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
    <section className="bg-[#0B1F3A] dark:bg-slate-950 text-white rounded-2xl">
      <div className="px-6 py-12 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-news-500 text-xs font-bold uppercase tracking-widest">
              <Mail className="h-4 w-4" /> Newsletter
            </div>
            <h2 className="mt-2 font-headline text-3xl font-extrabold leading-tight text-white">
              The legal briefing, every morning.
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-md">
              Regulatory updates and legal news that matters, explained clearly. Free, no spam.
            </p>
          </div>

          <div>
            {status === "success" ? (
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-4 rounded-md">
                <Check className="h-6 w-6 text-news-500 flex-shrink-0" />
                <p className="text-sm text-white">{message}</p>
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
                  className="flex-1 h-12 px-4 rounded-md bg-white text-slate-900 placeholder:text-slate-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-news-500"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-12 px-6 rounded-md bg-news-600 text-white font-bold hover:bg-news-700 disabled:opacity-70 inline-flex items-center justify-center gap-2 transition-colors"
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
            {status === "error" && <p className="mt-2 text-sm text-news-500">{message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
