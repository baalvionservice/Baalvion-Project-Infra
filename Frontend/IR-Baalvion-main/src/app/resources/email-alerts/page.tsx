"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell, FileText, CalendarDays, FileCheck, Landmark, LineChart, Newspaper,
  CheckCircle2, Loader2, ShieldCheck, ArrowRight,
} from "lucide-react";

const COMPANY = "Baalvion Industries Private Limited";

// Each option maps to a key persisted in the subscription's `preferences` JSON.
const ALERT_OPTIONS = [
  { key: "news", icon: Newspaper, label: "Press Releases & News", desc: "Company announcements and corporate news." },
  { key: "reports", icon: FileText, label: "Financial Reports & Results", desc: "Quarterly and annual financial reports." },
  { key: "events", icon: CalendarDays, label: "Events & Presentations", desc: "Earnings calls, investor days and webcasts." },
  { key: "filings", icon: FileCheck, label: "Regulatory Filings", desc: "Statutory and exchange filings." },
  { key: "governance", icon: Landmark, label: "Governance & Voting", desc: "Board, AGM and shareholder resolutions." },
  { key: "stock", icon: LineChart, label: "Stock Information", desc: "Share price and market updates." },
] as const;

type AlertKey = (typeof ALERT_OPTIONS)[number]["key"];

export default function EmailAlertsPage() {
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<Record<AlertKey, boolean>>({
    news: true, reports: true, events: true, filings: true, governance: false, stock: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState("");

  const selectedCount = Object.values(prefs).filter(Boolean).length;
  const allSelected = selectedCount === ALERT_OPTIONS.length;

  const toggle = (k: AlertKey) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const toggleAll = () => {
    const next = !allSelected;
    setPrefs(Object.fromEntries(ALERT_OPTIONS.map((o) => [o.key, next])) as Record<AlertKey, boolean>);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }
    if (selectedCount === 0) { setError("Select at least one alert type."); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/v1/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), preferences: prefs }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-black text-white py-14 md:py-20">
        <div className="container mx-auto px-4">
          <nav className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Resources</span>
            <span className="mx-2">/</span>
            <span className="text-primary">Email Alerts</span>
          </nav>
          <p className="text-sm font-bold text-primary tracking-widest mb-2">INVESTOR RESOURCES</p>
          <h1 className="text-4xl md:text-5xl font-bold max-w-3xl">Investor Email Alerts</h1>
          <p className="mt-4 max-w-2xl text-gray-300 text-lg">
            Get {COMPANY} investor news delivered straight to your inbox — the moment it&apos;s published.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-24 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Left: intro + benefits */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">Stay informed</h2>
              <p className="text-gray-600 leading-relaxed">
                Sign up to receive automated email alerts from {COMPANY}. Enter your email address,
                choose the updates you care about, and we&apos;ll notify you as soon as new investor
                information is released.
              </p>
              <ul className="space-y-3">
                {[
                  "Timely financial results and disclosures",
                  "Earnings calls, investor days and webcasts",
                  "Regulatory filings and governance updates",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <p>
                  We respect your privacy. Your email is used only to send the alerts you select and is
                  never shared. You can update or unsubscribe at any time.
                </p>
              </div>
            </div>

            {/* Right: form card */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-200 shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Bell className="h-5 w-5 text-primary" />
                    Subscribe to alerts
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">Fields marked * are required.</p>
                </div>

                {status === "done" ? (
                  <div className="px-6 py-12 sm:px-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold">You&apos;re subscribed</h4>
                    <p className="mt-2 text-sm text-gray-600">
                      Alerts will be sent to <span className="font-semibold">{email}</span>. Thank you for
                      following {COMPANY}.
                    </p>
                    <Button variant="outline" className="mt-6 rounded-sm" onClick={() => { setStatus("idle"); setEmail(""); }}>
                      Subscribe another email
                    </Button>
                  </div>
                ) : (
                  <form className="px-6 py-6 sm:px-8 sm:py-8 space-y-6" onSubmit={submit}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">Email address *</Label>
                      <Input
                        id="email" type="email" inputMode="email" autoComplete="email"
                        placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-gray-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Alert options *</Label>
                        <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
                          {allSelected ? "Clear all" : "Select all"}
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ALERT_OPTIONS.map((o) => {
                          const active = prefs[o.key];
                          return (
                            <button
                              type="button" key={o.key} onClick={() => toggle(o.key)}
                              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                                active ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                active ? "border-primary bg-primary text-white" : "border-gray-300 bg-white"
                              }`}>
                                {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </span>
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5 text-sm font-semibold">
                                  <o.icon className="h-3.5 w-3.5 text-gray-500" />{o.label}
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-500">{o.desc}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {error && <p className="text-sm text-rose-600">{error}</p>}

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-500">
                        By subscribing you agree to receive emails from {COMPANY}.
                      </p>
                      <Button type="submit" disabled={status === "submitting"} className="rounded-sm bg-black px-6 text-white hover:bg-gray-800">
                        {status === "submitting" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Subscribe <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                Looking for something else?{" "}
                <Link href="/resources/contact-ir" className="font-semibold text-primary hover:underline">Contact Investor Relations</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
