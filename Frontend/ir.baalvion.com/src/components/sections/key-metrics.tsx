import {
  CircleDollarSign,
  Repeat2,
  Globe2,
  Cpu,
  Activity,
  ShieldCheck,
  Plug,
  Clock,
} from "lucide-react";

// Key Metrics — dark, hairline-grid KPI board mirroring the market-opportunity
// section's grid pattern. All values are illustrative operational targets for an
// early-stage platform, not audited or reported metrics. Labelled as such.

const METRICS = [
  {
    icon: CircleDollarSign,
    value: "$1B+",
    label: "GMV facilitated across trade corridors (illustrative target)",
  },
  {
    icon: Repeat2,
    value: "1M+",
    label: "Transactions processed through the platform (illustrative target)",
  },
  {
    icon: Globe2,
    value: "50+",
    label: "Active trade corridors connecting buyers, sellers and financiers",
  },
  {
    icon: Cpu,
    value: "10M+",
    label: "AI decisions automated across logistics, finance and compliance",
  },
  {
    icon: Activity,
    value: "99.9%",
    label: "Platform uptime target for core trade operations",
  },
  {
    icon: ShieldCheck,
    value: "5M+",
    label: "Compliance and sanctions checks run across screened parties",
  },
  {
    icon: Plug,
    value: "100+",
    label: "Partner integrations across banks, carriers and customs systems",
  },
  {
    icon: Clock,
    value: "7 days",
    label: "Average time saved per shipment versus legacy workflows",
  },
];

export default function KeyMetricsSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Key Metrics
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            The numbers behind the platform.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Baalvion is building the AI-native operating system for global B2B
            trade. The indicators below frame the scale the platform is designed
            to operate at across logistics, trade finance and compliance — the
            operating surface we are engineering toward.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-black p-8 transition-colors hover:bg-white/[0.03]">
              <m.icon className="h-7 w-7 text-primary" />
              <p className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">{m.value}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{m.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-white/40">
          All values shown are{" "}
          <span className="text-white/60 font-semibold">illustrative operational targets</span>{" "}
          for an early-stage company designed to convey the intended scale of the
          platform. They are forward-looking, not audited, reported, or
          independently verified metrics, and do not represent achieved results.
          Actual outcomes may differ materially. Nothing here is an offer,
          investment advice, or a guarantee of any result.
        </p>
      </div>
    </section>
  );
}
