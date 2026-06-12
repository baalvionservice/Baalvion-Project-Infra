import {
  Globe,
  BrainCircuit,
  Layers,
  Network,
  Coins,
  Gauge,
  ShieldCheck,
  Database,
  TrendingUp,
  Scale,
  Rocket,
  Handshake,
  Infinity as InfinityIcon,
  type LucideIcon,
} from "lucide-react";

// Investment Highlights — thirteen institutional reasons to invest, on a light
// background for rhythm against the dark hero/CTA. Each card pairs a numbered
// index with a lucide icon and two sentences of rationale.
type Highlight = {
  num: string;
  title: string;
  icon: LucideIcon;
  body: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    num: "01",
    title: "Massive, durable market",
    icon: Globe,
    body: "Global B2B trade moves more than $13 trillion in goods and capital every year. That scale is structural, not cyclical — it is the foundation of the world economy and it is not going away.",
  },
  {
    num: "02",
    title: "AI technology moat",
    icon: BrainCircuit,
    body: "Baalvion runs proprietary AI agents for compliance and sanctions screening, logistics route optimisation and HS-code classification. These models are difficult to replicate and compound with every transaction they process.",
  },
  {
    num: "03",
    title: "Integrated platform",
    icon: Layers,
    body: "Logistics, trade finance and compliance live in one system rather than three disconnected vendors. We deliver as a single platform what competitors sell piecemeal — eliminating the integration burden buyers carry today.",
  },
  {
    num: "04",
    title: "Powerful network effects",
    icon: Network,
    body: "Every new corridor, partner and transaction increases the platform's value for all other participants. Liquidity, data and connectivity reinforce one another in a self-strengthening cycle of growth.",
  },
  {
    num: "05",
    title: "Multiple high-margin revenue streams",
    icon: Coins,
    body: "Revenue spans recurring SaaS subscriptions, per-transaction fees and trade-finance economics. Diversified, complementary streams reduce single-point dependency and deepen monetisation of each customer relationship.",
  },
  {
    num: "06",
    title: "Software-like scalability",
    icon: Gauge,
    body: "The marginal cost of serving each additional corridor approaches zero. Once the core platform exists, expansion is primarily a software exercise — not a linear build-out of physical capacity.",
  },
  {
    num: "07",
    title: "Regulatory & compliance moat",
    icon: ShieldCheck,
    body: "Automated AML, KYC and sanctions screening is operationally demanding and hard to replicate at scale. Once embedded in a customer's regulated workflow, it raises switching costs and defends the relationship.",
  },
  {
    num: "08",
    title: "Proprietary data flywheel",
    icon: Database,
    body: "Trade, risk and document data flow continuously back into the AI, sharpening every model over time. The longer the platform operates, the more accurate and defensible its intelligence becomes.",
  },
  {
    num: "09",
    title: "Emerging-market tailwinds",
    icon: TrendingUp,
    body: "Baalvion is positioned where trade growth and digitisation are fastest. These markets are leapfrogging legacy systems, and an AI-native platform is built precisely for that transition.",
  },
  {
    num: "10",
    title: "Capital-efficient growth",
    icon: Scale,
    body: "Capital is deployed with discipline toward infrastructure-grade unit economics rather than subsidised growth. The model is designed to compound durable value, not to buy revenue.",
  },
  {
    num: "11",
    title: "Multi-product expansion runway",
    icon: Rocket,
    body: "A deliberate roadmap of adjacent products extends from the same platform and customer base. Each addition deepens engagement and opens new monetisation without rebuilding the foundation.",
  },
  {
    num: "12",
    title: "Strategic partnership leverage",
    icon: Handshake,
    body: "Banks, carriers, customs authorities and payment rails extend reach without heavy capital expenditure. Partnerships convert third-party infrastructure into distribution and capability for the platform.",
  },
  {
    num: "13",
    title: "Long-term value & optionality",
    icon: InfinityIcon,
    body: "Owning critical trade infrastructure creates durable, compounding value over time. That positioning preserves strategic optionality and multiple potential paths to future liquidity.",
  },
];

export default function InvestmentHighlights({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Investment Highlights
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Thirteen reasons to invest in Baalvion.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            A category-defining market, a proprietary AI technology stack and an
            integrated platform — the structural advantages behind the investment case.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.num}
              className="group flex flex-col bg-white p-7 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-[0.2em] text-primary">
                  {item.num}
                </span>
                <item.icon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-primary" />
              </div>
              <h3 className="mt-6 text-lg font-bold tracking-tight text-black">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-xs text-gray-400">
          These highlights include forward-looking statements about markets,
          strategy and potential outcomes. Such statements are illustrative, involve
          known and unknown risks, and are not guarantees of future performance or
          returns. Market figures reflect external estimates for global trade and do
          not represent company financial results.
        </p>
      </div>
    </section>
  );
}
