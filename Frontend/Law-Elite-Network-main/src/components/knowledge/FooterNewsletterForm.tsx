"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

// Posts to the existing /api/newsletter route handler (src/app/api/newsletter/route.ts).
// Previously the footer button had no onClick/form -- clicking it did nothing.
export function FooterNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <p role="status" className="text-[12px] font-medium text-emerald-300 max-w-[280px]">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-[280px]">
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        disabled={status === "loading"}
        aria-invalid={status === "error"}
        className="w-full h-11 rounded px-4 text-[13px] text-slate-900 placeholder:text-slate-400 bg-white/95 focus:outline-none focus:ring-2 focus:ring-[#c2d4ef]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-[#c2d4ef] hover:bg-white text-[#222b3e] font-bold uppercase text-[11px] tracking-[0.15em] px-10 h-12 rounded shadow-xl transition-all duration-300 w-full disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        Newsletter Sign Up
      </button>
      {status === "error" && (
        <p role="alert" className="text-[11px] font-medium text-red-300">
          {message}
        </p>
      )}
    </form>
  );
}
