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
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-12">
            STANDARDS
          </span>
          <h2 className="text-xs font-mono font-black uppercase tracking-widest text-black dark:text-white">
            // OUR EDITORIAL COMMITMENT
          </h2>
        </div>
        <Link href="/editorial-policy" className="text-xs font-mono font-black uppercase text-[#c8102e] hover:underline">
          FULL EDITORIAL POLICY →
        </Link>
      </div>
      <ul className="flex flex-wrap gap-3">
        {STANDARDS.map(({ icon: Icon, label, body }) => (
          <li
            key={label}
            className="group flex items-center gap-2 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xs"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#c8102e]" aria-hidden />
            <span className="text-xs font-black uppercase font-serif text-black dark:text-white">{label}</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-600 dark:text-slate-400">— {body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
