import {
  Crosshair,
  Expand,
  Network,
  Rocket,
  Handshake,
  Map,
  Share2,
} from "lucide-react";

// Growth Strategy — light, three-horizons framework. Forward-looking strategic
// intent for an early-stage company; not a commitment, timeline guarantee, or
// forecast. Inline-only presentation, no chart libraries.

const HORIZONS = [
  {
    tag: "Now",
    label: "H1",
    icon: Crosshair,
    title: "Deepen the core",
    levers: [
      "Win priority trade corridors with end-to-end execution depth",
      "Expand within existing customers — more volume, more workflows",
      "Harden the AI compliance and logistics agents on real trade data",
      "Compound reliability and trust as the default rails for each corridor",
    ],
  },
  {
    tag: "Next",
    label: "H2",
    icon: Expand,
    title: "Expand the platform",
    levers: [
      "Open new corridors, geographies and adjacent product lines",
      "Add embedded finance, insurance and analytics on shared rails",
      "Grow the partner network across banks, carriers and customs",
      "Standardise integrations so each new partner compounds reach",
    ],
  },
  {
    tag: "Future",
    label: "H3",
    icon: Network,
    title: "Become the ecosystem",
    levers: [
      "Open the platform so third parties build on Baalvion primitives",
      "Operate a trade-data network connecting the parties of global trade",
      "Compound the proprietary data flywheel into a durable moat",
      "Set the interoperability standard beneath cross-border commerce",
    ],
  },
];

const GTM_LEVERS = [
  {
    icon: Rocket,
    title: "Product-led adoption",
    note: "Workflows that earn usage on their own merit before any sales motion.",
  },
  {
    icon: Handshake,
    title: "Strategic partnerships",
    note: "Banks, carriers and customs bodies that extend reach and credibility.",
  },
  {
    icon: Map,
    title: "Corridor-by-corridor expansion",
    note: "Win density in one route, then template the playbook to the next.",
  },
  {
    icon: Share2,
    title: "Data network effects",
    note: "Each transaction sharpens the agents and widens the moat for all.",
  },
];

export default function GrowthStrategySection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Growth Strategy
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Three horizons of compounding growth.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Our strategy is sequenced, not speculative. We deepen the core before
            we widen it, and we widen the platform before we open it — so that
            every stage strengthens the next. Across all three horizons the same
            engine compounds: more corridors, more data, sharper AI, a wider moat.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {HORIZONS.map((h) => (
            <div
              key={h.label}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-gray-50 p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-[0.2em] text-primary">{h.label}</span>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {h.tag}
                </span>
              </div>
              <h.icon className="mt-6 h-8 w-8 text-primary" />
              <h3 className="mt-4 text-xl md:text-2xl font-bold tracking-tight">{h.title}</h3>
              <ul className="mt-5 space-y-3">
                {h.levers.map((lever) => (
                  <li key={lever} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{lever}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">Go-to-market levers</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            The motions that carry the strategy across each horizon.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {GTM_LEVERS.map((g) => (
              <div key={g.title} className="bg-white p-6">
                <g.icon className="h-6 w-6 text-primary" />
                <p className="mt-5 text-base font-bold text-black">{g.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{g.note}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-gray-400">
          This section describes forward-looking strategic intent for an
          early-stage company. Horizons, timeframes (Now / Next / Future) and
          levers are illustrative of direction and are not commitments, delivery
          timelines, forecasts, or guarantees of any outcome. Plans may change as
          markets, partners and execution evolve, and actual results may differ
          materially.
        </p>
      </div>
    </section>
  );
}
