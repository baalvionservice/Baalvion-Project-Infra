import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldOff, Eye, Clock, Scale } from "lucide-react";

const STANDARDS = [
  { icon: GraduationCap, label: "Educational", body: "designed to explain, not hype" },
  { icon: ShieldOff, label: "Independent", body: "separated from advertising" },
  { icon: Eye, label: "Transparent", body: "sources disclosed where appropriate" },
  { icon: Clock, label: "Current", body: "time-sensitive info reviewed and updated" },
  { icon: Scale, label: "Responsible", body: "not individualized financial advice" },
] as const;

/**
 * "Our Editorial Standards" — a compact, single-row badge list rather than
 * another set of icon+paragraph blocks, so five short commitments scan in a
 * glance instead of repeating HowWeWork's stepper rhythm one section down.
 */
export function EditorialStandards() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border/60">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
          Our Editorial Standards
        </h2>
        <Link href="/editorial-policy" className="text-sm font-bold text-primary hover:underline underline-offset-2">
          Full Editorial Policy →
        </Link>
      </div>
      <ul className="flex flex-wrap gap-3">
        {STANDARDS.map(({ icon: Icon, label, body }) => (
          <li
            key={label}
            className="group flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-bold text-foreground">{label}</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">— {body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
