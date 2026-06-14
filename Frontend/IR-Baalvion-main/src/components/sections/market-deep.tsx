import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Sparkles, LineChart } from "lucide-react";

// Market Opportunity (deep) — sizes the addressable opportunity with a
// TAM/SAM/SOM frame and an illustrative adoption trajectory. Every figure is a
// market estimate and management assumption, not company results.

const TAM_SAM_SOM = [
  {
    tier: "TAM",
    figure: "$13T+",
    width: 100,
    opacity: 1,
    definition: "Total annual global B2B trade flows — the full universe of goods, capital and documentation moving across borders.",
  },
  {
    tier: "SAM",
    figure: "~$1.8T",
    width: 14,
    opacity: 0.7,
    definition: "Digitally-addressable spend across trade software, embedded trade finance and compliance & automation.",
  },
  {
    tier: "SOM",
    figure: "~$40B",
    width: 2,
    opacity: 0.45,
    definition: "Near-term serviceable obtainable market across Baalvion's priority corridors and products over a 3–5 year horizon.",
  },
];

const INDUSTRY_TRENDS = [
  "Digitisation of trade documentation, replacing paper-heavy, manual workflows with structured data.",
  "Embedded finance bringing working capital and settlement into the transaction itself.",
  "Real-time compliance and sanctions automation as regulatory regimes tighten globally.",
  "Supply-chain resilience and nearshoring reshaping corridors and counterparty networks.",
  "API-first interoperability connecting fragmented logistics, banking and customs systems.",
];

const AI_OPPORTUNITY = [
  "Automated compliance decisioning — sanctions and risk screening at machine speed and consistency.",
  "Predictive logistics and route optimization that compress transit time, cost and exposure.",
  "Intelligent HS classification and duty estimation, removing a persistent source of error and delay.",
  "Document understanding that validates trade paperwork in seconds instead of days.",
];

const ADOPTION_BARS = [
  { year: "Y1", h: 24 },
  { year: "Y2", h: 40 },
  { year: "Y3", h: 58 },
  { year: "Y4", h: 78 },
  { year: "Y5", h: 100 },
];

export default function MarketDeepSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Market Opportunity</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            A generational market, addressable for the first time.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Global B2B trade has always been vast, but never truly addressable as software — its value locked inside paper, intermediaries and disconnected systems. The convergence of digitisation, embedded finance and applied AI is opening that value for the first time. Baalvion is building the AI-native operating system underneath it, across logistics, trade finance and compliance.
          </p>
        </div>

        {/* TAM / SAM / SOM */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-10">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">Sizing the opportunity</h3>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            From the full scale of global trade flows down to the market Baalvion can realistically serve in the near term.
          </p>

          <div className="mt-10 space-y-8">
            {TAM_SAM_SOM.map((t) => (
              <div key={t.tier}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t.tier}</span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">{t.figure}</span>
                </div>
                <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full min-w-[6px] rounded-full bg-primary transition-all"
                    style={{ width: `${t.width}%`, opacity: t.opacity }}
                  />
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">{t.definition}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-white/40">
            Bars are scaled relative to TAM and shown for illustration; the SOM sliver is widened to a minimum width for legibility.
          </p>
        </div>

        {/* Three sub-blocks */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader className="items-start">
              <Layers className="h-8 w-8 text-primary" />
              <CardTitle className="mt-4 text-white">Industry trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {INDUSTRY_TRENDS.map((t) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader className="items-start">
              <Sparkles className="h-8 w-8 text-primary" />
              <CardTitle className="mt-4 text-white">The AI opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                AI is the unlock — compressing cost and risk out of every shipment.
              </p>
              <ul className="space-y-3">
                {AI_OPPORTUNITY.map((t) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader className="items-start">
              <LineChart className="h-8 w-8 text-primary" />
              <CardTitle className="mt-4 text-white">Technology adoption forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
                {ADOPTION_BARS.map((b) => (
                  <div
                    key={b.year}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all"
                    style={{ height: `${b.h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-2 sm:gap-3">
                {ADOPTION_BARS.map((b) => (
                  <span key={b.year} className="flex-1 text-center text-xs font-medium text-white/50">{b.year}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/40">
                Illustrative trajectory of digital trade-infrastructure adoption — not a financial forecast.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-xs text-white/40">
          TAM, SAM and SOM figures reflect external market estimates and management assumptions about the addressable opportunity. They are illustrative, do not represent company financial results, projections or guarantees, and should not be relied upon as such.
        </p>
      </div>
    </section>
  );
}
