"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";

type Status = "idle" | "loading" | "success" | "error";

export function WeeklyDigestSignup({ categoryName }: { categoryName?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const color = getTopicColor(categoryName);

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
        body: JSON.stringify({ email, source: "weekly-digest" }),
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
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div
      className="flex flex-col items-start justify-between gap-6 rounded-lg px-8 py-10 sm:flex-row sm:items-center"
      style={{ backgroundColor: color }}
    >
      <div>
        <p className="text-2xl font-black leading-tight text-white sm:text-3xl">
          Get weekly {categoryName || "finance"} tips
        </p>
        <p className="mt-2 text-sm font-medium text-white/85">No spam — one email a week, unsubscribe anytime.</p>
      </div>

      {status === "success" ? (
        <p className="shrink-0 text-sm font-bold text-white">{message}</p>
      ) : (
        <div className="w-full shrink-0 sm:w-auto">
          <form onSubmit={handleSubmit} className="flex w-full overflow-hidden rounded-md sm:w-[420px]">
            <span className="flex items-center bg-white pl-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </span>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 bg-white px-3 py-3 text-sm text-foreground outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 bg-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Submit"}
            </button>
          </form>
          {status === "error" && <p className="mt-2 text-xs font-semibold text-white">{message}</p>}
        </div>
      )}
    </div>
  );
}
