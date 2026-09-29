import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cpu,
  BrainCircuit,
  Users,
  FlaskConical,
  Megaphone,
  Globe2,
  ShieldCheck,
  Handshake,
  UserPlus,
  ShieldHalf,
} from "lucide-react";

// Use of Proceeds — framed as a Growth Acceleration Plan: disciplined,
// milestone-gated deployment of capital to compound an existing platform
// advantage. Allocations are indicative and subject to board governance.

interface Allocation {
  label: string;
  pct: number;
  icon: typeof Cpu;
  intent: string;
}

const ALLOCATIONS: Allocation[] = [
  {
    label: "Product development",
    pct: 22,
    icon: Cpu,
    intent: "Deepen the core trade operating system across logistics, finance and compliance. Unlocks the unified workflow that turns multi-vendor adoption into platform lock-in.",
  },
  {
    label: "AI infrastructure",
    pct: 18,
    icon: BrainCircuit,
    intent: "Scale the model, data and inference layer powering compliance, logistics and document agents. Unlocks higher automation rates and falling marginal cost per shipment.",
  },
  {
    label: "Engineering & talent",
    pct: 16,
    icon: Users,
    intent: "Recruit senior platform, ML and trade-domain engineers. Unlocks throughput on the roadmap and the reliability standard institutional customers require.",
  },
  {
    label: "Research & development",
    pct: 10,
    icon: FlaskConical,
    intent: "Advance next-generation classification, risk and optimization capability ahead of the market. Unlocks a widening technical lead and defensible IP.",
  },
  {
    label: "Sales & marketing",
    pct: 12,
    icon: Megaphone,
    intent: "Build an institutional go-to-market motion for enterprise and corridor partners. Unlocks a repeatable, measurable pipeline with disciplined acquisition economics.",
  },
  {
    label: "Global & corridor expansion",
    pct: 9,
    icon: Globe2,
    intent: "Light up priority trade corridors with localized compliance and customs coverage. Unlocks new addressable volume where the platform advantage compounds first.",
  },
  {
    label: "Operations & resilience",
    pct: 5,
    icon: ShieldCheck,
    intent: "Harden uptime, security and operational controls to infrastructure grade. Unlocks the trust profile needed to carry mission-critical trade flows.",
  },
  {
    label: "Strategic partnerships",
    pct: 4,
    icon: Handshake,
    intent: "Integrate carriers, banks and customs authorities into the network. Unlocks distribution and the reinforcing network effects of an open trade platform.",
  },
  {
    label: "Customer acquisition",
    pct: 4,
    icon: UserPlus,
    intent: "Convert qualified demand into anchor accounts with strong retention. Unlocks the reference base and net-revenue-retention that compounds platform value.",
  },
];

const CAPITAL_DISCIPLINE = [
  {
    title: "Milestone-gated deployment",
    body: "Capital is released against defined product, commercial and operational milestones — not deployed ahead of evidence.",
  },
  {
    title: "Infrastructure-grade unit economics",
    body: "Every line item is underwritten to improve gross margin and marginal cost per transaction as volume scales.",
  },
  {
    title: "Governance oversight of allocation",
    body: "The board reviews and ratifies allocation against plan, with the discipline to reweight as the market and roadmap evolve.",
  },
];

const SEGMENT_OPACITY: Record<number, string> = {
  0: "1",
  1: "0.88",
  2: "0.76",
  3: "0.64",
  4: "0.54",
  5: "0.44",
  6: "0.36",
  7: "0.28",
  8: "0.2",
};

export default function UseOfProceedsSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Use of Proceeds</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            A disciplined plan to accelerate a category-defining platform.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            This is a growth acceleration plan, not a funding requirement. Capital is deployed against a clear, returns-driven roadmap with measurable milestones — compounding an existing platform advantage rather than purchasing a starting position. Every allocation below maps to a specific outcome the platform unlocks.
          </p>
        </div>

        {/* Stacked allocation bar */}
        <div className="mt-16">
          <div className="flex h-5 w-full overflow-hidden rounded-full border border-neutral-200">
            {ALLOCATIONS.map((a, i) => (
              <div
                key={a.label}
                className="h-full bg-primary"
                style={{ width: `${a.pct}%`, opacity: SEGMENT_OPACITY[i] }}
                title={`${a.label} — ${a.pct}%`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {ALLOCATIONS.map((a, i) => (
              <div key={a.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                  style={{ opacity: SEGMENT_OPACITY[i] }}
                />
                <span className="text-xs font-medium text-gray-600">
                  {a.label} <span className="font-bold text-black">{a.pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ALLOCATIONS.map((a) => (
            <Card key={a.label} className="border-neutral-200 bg-gray-50">
              <CardHeader className="items-start">
                <div className="flex w-full items-center justify-between">
                  <a.icon className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold tracking-tight text-black">{a.pct}%</span>
                </div>
                <CardTitle className="mt-4 text-black">{a.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{a.intent}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capital discipline callout */}
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-black p-6 text-white md:p-10">
          <div className="flex items-center gap-3">
            <ShieldHalf className="h-6 w-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">Capital discipline</h3>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-white/70">
            Returns are protected by the way capital is governed, not only where it is spent.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {CAPITAL_DISCIPLINE.map((c) => (
              <div key={c.title} className="border-t border-white/10 pt-5">
                <p className="text-sm font-semibold text-white">{c.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-400">
          Allocations are indicative, sum to 100%, and are subject to board governance and market conditions. They represent management's current intended deployment plan, not a commitment, forecast or guarantee of outcomes.
        </p>
      </div>
    </section>
  );
}
