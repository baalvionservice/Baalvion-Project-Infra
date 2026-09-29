import { Globe, TrendingUp, Layers, Network } from "lucide-react";

// Market Opportunity — frames the scale of the global B2B trade infrastructure
// opportunity Baalvion is building toward. Figures are market estimates (TAM),
// not company results, and are labelled as such.
export default function MarketOpportunitySection({ id }: { id: string }) {
  const stats = [
    { value: "$13T+", label: "Annual global B2B trade flows we are building to digitise and serve", icon: Globe },
    { value: "$2.5T", label: "Persistent global trade-finance gap leaving demand unmet every year", icon: TrendingUp },
    { value: "~80%", label: "Of world trade still depends on fragmented, paper-heavy processes", icon: Layers },
    { value: "1", label: "Unified platform connecting logistics, finance and compliance", icon: Network },
  ];

  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">The Opportunity</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            The infrastructure of global trade is being rebuilt — once in a generation.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Global commerce moves trillions of dollars in goods, capital and documentation every year, yet it still runs on a patchwork of disconnected systems, manual paperwork and siloed intermediaries. Baalvion is building the unified operating system beneath it — capturing a <span className="text-white font-semibold">$13 trillion-plus</span> opportunity across logistics, trade finance and compliance.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-black p-8 transition-colors hover:bg-white/[0.03]">
              <s.icon className="h-7 w-7 text-primary" />
              <p className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">{s.value}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-white/40">
          Figures reflect external market estimates for global trade, the trade-finance gap and digitisation, and represent the addressable opportunity Baalvion is building toward — not company financial results.
        </p>
      </div>
    </section>
  );
}
