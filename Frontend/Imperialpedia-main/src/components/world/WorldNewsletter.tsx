"use client";
import { useState, type FormEvent } from "react";

/** CNBC-style inline newsletter band — posts to the site's real
 * newsletter API (same endpoint as components/common/Newsletter.tsx),
 * restyled to match the World section's dense editorial look. */
export default function WorldNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
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
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-[#002f6c] px-4 sm:px-6 py-5 sm:py-6">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <p className="world-kicker text-[10px] font-black tracking-widest text-[#fcb700] uppercase mb-1">
            Free Newsletter
          </p>
          <h2 className="text-white text-base sm:text-lg font-bold leading-snug">
            Get World Markets news delivered to your inbox every morning.
          </h2>
        </div>

        {status === "success" ? (
          <p className="text-[#00a857] text-sm font-bold shrink-0">You&rsquo;re subscribed.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full sm:w-auto gap-2 shrink-0">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 sm:w-64 px-3 py-2 text-sm rounded-sm border-none focus:outline-none focus:ring-2 focus:ring-[#ce2b2b]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="world-kicker bg-[#ce2b2b] text-white text-xs font-bold px-4 py-2 rounded-sm hover:bg-[#a82121] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "SIGN UP"}
            </button>
          </form>
        )}
      </div>
      {status === "error" && (
        <p className="max-w-screen-xl mx-auto text-[#fcb700] text-xs mt-2">
          Something went wrong — try again.
        </p>
      )}
    </div>
  );
}
