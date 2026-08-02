"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Twitter, Linkedin, Facebook, Instagram, Check, Loader2 } from "lucide-react";
import { env } from "@/config/env";

type SubscribeStatus = "idle" | "loading" | "success" | "error";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "News", href: "/news" },
      { label: "Investing", href: "/investing" },
      { label: "Banking", href: "/banking" },
      { label: "Personal Finance", href: "/personal-finance" },
      { label: "Economy", href: "/economy" },
      { label: "Reviews", href: "/reviews" },
      { label: "Financial Dictionary", href: "/financial-intelligence" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Our Authors", href: "/authors" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Fact-Checking Policy", href: "/fact-checking" },
      { label: "Corrections Policy", href: "/corrections" },
      { label: "Advertise With Us", href: "/advertise" },
    ],
  },
  {
    title: "Legal & Privacy",
    links: [
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

// Matches the handles declared in structuredData.ts `sameAs` (Twitter, LinkedIn);
// the rest use root domains rather than fabricated handles until those profiles exist.
const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/imperialpedia", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/imperialpedia", label: "LinkedIn" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
];

export function FooterRefactored() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setEmail("");
        setMessage(data.message || "You're subscribed. Check your inbox for confirmation.");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <footer className="border-t border-border bg-muted/30">
      {/* Newsletter Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-b border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Get Weekly Financial Intelligence
            </h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for expert analysis, market insights,
              and investment ideas delivered to your inbox every week.
            </p>
          </div>
          <div>
            {status === "success" ? (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{message}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground col-span-full sm:col-span-2 mt-2">
            We respect your privacy. Unsubscribe at any time. Read our{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column (Desktop Only) */}
          <div className="hidden lg:flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">
                I
              </div>
              <span className="font-bold text-lg text-foreground">
                Imperialpedia
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Financial intelligence for the informed investor. Real data,
              expert analysis, professional insights.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              © {currentYear} Imperialpedia. All rights reserved.
            </p>
          </div>

          {/* Navigation Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-bold text-foreground text-sm mb-4">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-t border-border">
          <div>
            <h4 className="font-bold text-foreground text-sm mb-4">
              Follow Us
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-foreground text-sm mb-4">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <a
                href={`mailto:${env.contactEmail}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                {env.contactEmail}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
              >
                Have a Tip? <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © {currentYear}{" "}
            <Link href="/" className="text-foreground hover:text-primary">
              Imperialpedia
            </Link>
            . All rights reserved. |{" "}
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">
              Disclaimer
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Powered by{" "}
              <a
                href="https://baalvion.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary"
              >
                Baalvion
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterRefactored;
