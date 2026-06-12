import { Flag, Layers, Bot, Route, TrendingUp, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Company Story — the founding narrative and milestone arc for Baalvion
// Industries. Dark surface to read as the company's on-the-record origin story.
// Future-dated milestones are clearly framed as aspirational, not commitments.

type Milestone = {
  year: string;
  title: string;
  body: string;
  icon: LucideIcon;
  status: "done" | "active" | "ahead";
};

const MILESTONES: Milestone[] = [
  {
    year: "2025",
    title: "Baalvion Industries incorporated",
    body: "Founded in India with roots across Odisha and Maharashtra, set up to build connective infrastructure for global trade.",
    icon: Flag,
    status: "done",
  },
  {
    year: "Foundation",
    title: "Platform foundation",
    body: "A unified architecture brings logistics, trade finance and compliance onto one intelligent operating layer.",
    icon: Layers,
    status: "done",
  },
  {
    year: "AI agents",
    title: "AI agents deployed",
    body: "Compliance and sanctions screening, logistics route optimisation and HS-code classification go live in production.",
    icon: Bot,
    status: "active",
  },
  {
    year: "Corridors",
    title: "First corridors",
    body: "Early trade flows are onboarded, proving the platform against the real friction of cross-border commerce.",
    icon: Route,
    status: "active",
  },
  {
    year: "Scaling",
    title: "Scaling",
    body: "Expanding corridors, partners and products as the network — and its intelligence — compounds with every shipment.",
    icon: TrendingUp,
    status: "ahead",
  },
  {
    year: "Vision",
    title: "The operating system for global trade",
    body: "Becoming the default infrastructure beneath global B2B commerce — the layer every shipment quietly runs on.",
    icon: Compass,
    status: "ahead",
  },
];

const STATUS_LABEL: Record<Milestone["status"], string> = {
  done: "Established",
  active: "In progress",
  ahead: "Aspirational",
};

export default function CompanyStorySection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Our Story
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Built by operators who lived the problem.
          </h2>

          <div className="mt-6 space-y-5 text-lg text-white/70">
            <p>
              The hardest problems in global trade are not the goods themselves —
              they are the compliance checks, the financing gaps and the
              fragmentation between every party that has to touch a shipment.
              We watched the same friction repeat across corridors and
              counterparties: documents rekeyed by hand, capital stuck waiting on
              approvals, and risk assessed in silos that never spoke to each
              other.
            </p>
            <p>
              So we made a deliberate choice. Rather than ship another point tool
              that solved one slice and added one more system to integrate, we
              set out to build a single AI-native platform — one operating layer
              where logistics, trade finance and compliance finally share the
              same intelligence and the same source of truth.
            </p>
            <p>
              Our conviction is simple: in trade, infrastructure wins, not
              features. Features get copied; connective rails that everyone comes
              to depend on do not. That belief shapes every decision — we would
              rather earn trust in production with deployed AI agents than win a
              demo, because credibility in this category is built shipment by
              shipment.
            </p>
            <p>
              The long-term vision follows directly from that. We are building
              toward becoming the default operating system beneath global B2B
              commerce — the quiet, dependable layer that moves goods, capital
              and clearance for everyone who trades across borders.
            </p>
          </div>
        </div>

        {/* Milestone timeline */}
        <div className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            The Arc
          </p>
          <ol className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {MILESTONES.map((m) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="relative bg-black p-7 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>
                  <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-primary">
                    {m.year}
                  </p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {m.body}
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-white/40">
            Milestones marked aspirational describe Baalvion&rsquo;s intended
            direction and are forward-looking statements — not commitments,
            timelines or guarantees of outcomes.
          </p>
        </div>

        {/* Mission + Vision */}
        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
          <div className="bg-black p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Mission
            </p>
            <p className="mt-4 text-xl font-semibold leading-snug tracking-tight md:text-2xl">
              Remove the friction from every shipment by unifying logistics,
              trade finance and compliance into one intelligent, AI-native
              platform.
            </p>
          </div>
          <div className="bg-black p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Vision
            </p>
            <p className="mt-4 text-xl font-semibold leading-snug tracking-tight md:text-2xl">
              To become the operating system beneath global B2B trade — the
              default infrastructure the world&rsquo;s commerce quietly runs on.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
