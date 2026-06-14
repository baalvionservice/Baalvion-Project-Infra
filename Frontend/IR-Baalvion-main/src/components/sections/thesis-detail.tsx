import {
  AlertTriangle,
  Boxes,
  Globe2,
  Clock,
  Users,
  Cpu,
  TrendingUp,
  DoorOpen,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Thesis Detail — the full, numbered investment thesis (01–09) rendered as a
// left-rail-numbered editorial sequence. Light surface to read as the
// considered, on-the-record articulation of why Baalvion is built to win.
// Forward-looking statements are framed as conviction, not financial guidance.

type Pillar = {
  no: string;
  icon: LucideIcon;
  heading: string;
  body: string;
};

const PILLARS: Pillar[] = [
  {
    no: "01",
    icon: AlertTriangle,
    heading: "Problem",
    body: "Global trade still runs on disconnected systems, manual paperwork and siloed intermediaries that were never designed to talk to one another. Every shipment carries hidden cost, avoidable delay and real compliance exposure as documents are rekeyed across banks, customs authorities, carriers and counterparties. These are not edge-case inefficiencies — they are structural, and they compound at the scale of a $13 trillion-plus market. The friction is so embedded that most participants treat it as the unchangeable price of doing business across borders.",
  },
  {
    no: "02",
    icon: Boxes,
    heading: "Solution",
    body: "Baalvion is one AI-native platform that unifies logistics, trade finance and compliance into a single operating layer beneath every shipment. Instead of stitching together point tools, we remove the friction at its source — orchestrating movement, capital and regulatory clearance from a shared, intelligent system of record. AI agents handle the work that previously demanded teams of specialists: screening parties, optimising routes, classifying goods and validating documents. The result is trade that moves faster, costs less and stays compliant by design.",
  },
  {
    no: "03",
    icon: Globe2,
    heading: "Market",
    body: "The opportunity is generational in scale: more than $13 trillion in annual B2B trade flows, alongside a persistent $2.5 trillion trade-finance gap that leaves real demand unmet every year. Roughly 80% of this activity still depends on fragmented, paper-heavy processes that have barely been touched by modern software. That combination — enormous volume, structural under-financing and minimal digitisation — is precisely where durable infrastructure businesses are built. We are not competing for a slice of a mature market; we are helping digitise one that is still overwhelmingly analog.",
  },
  {
    no: "04",
    icon: Clock,
    heading: "Timing",
    body: "Three forces are converging at once. AI has matured from demonstration to deployment, making autonomous decisioning across compliance, routing and documentation genuinely production-grade. API-first banking and customs rails now expose the connectivity that earlier platforms simply could not access. And in the wake of pandemic-era disruption, enterprises are actively re-architecting their supply chains rather than defending the status quo. Each of these alone would be meaningful — together they create a rare inflection point, and the window to establish the connective infrastructure is open now.",
  },
  {
    no: "05",
    icon: Users,
    heading: "Team",
    body: "Baalvion is built by operators and engineers who ship — not by a team selling a roadmap. The AI agents at the core of the platform are real and deployed: compliance and sanctions screening, logistics route optimisation and HS-code classification are live, not theoretical. That bias toward execution over slideware is the company's operating culture, and it is the single best predictor of which infrastructure platforms endure. We believe credibility in this category is earned in production, and we intend to keep earning it shipment by shipment.",
  },
  {
    no: "06",
    icon: Cpu,
    heading: "Technology",
    body: "Our defensibility comes from proprietary AI decisioning applied across the hardest parts of trade: compliance and AML/KYC, multi-leg routing, and document understanding. Each decision the system makes — a sanctions match, an optimal corridor, a validated invoice, a classified good — feeds back into models that get sharper with volume. This compounding is the moat: not a single feature, but an accumulating intelligence advantage that is difficult to replicate from a standing start. As corridors and customers grow, the system's judgement improves, widening the gap between Baalvion and any point solution.",
  },
  {
    no: "07",
    icon: TrendingUp,
    heading: "Scalability",
    body: "The business carries software economics, not the linear cost curve of traditional trade intermediaries. Each new corridor and customer adds margin rather than proportional headcount, because the platform's intelligence and infrastructure are already built. As more participants transact across shared rails, network effects take hold — every additional party, lane and document makes the system more valuable for everyone on it. That dynamic turns scale from a cost burden into a compounding advantage, the hallmark of category-defining infrastructure.",
  },
  {
    no: "08",
    icon: DoorOpen,
    heading: "Exit Potential",
    body: "Positioning Baalvion as infrastructure — rather than a single application — creates multiple credible long-term paths to liquidity. Financial and logistics incumbents have a clear strategic incentive to acquire connective rails they cannot easily build, making strategic acquisition a realistic outcome. Equally, the scale of the underlying market supports the ambition of a category-leading, independent public company. We are building toward optionality: a business valuable enough that the most attractive path can be chosen from a position of strength, not necessity.",
  },
  {
    no: "09",
    icon: Sparkles,
    heading: "Future Opportunities",
    body: "The unified platform is a foundation, not a ceiling. Once logistics, finance and compliance share a single intelligent layer, adjacent products extend naturally from it — embedded finance, trade-credit insurance, analytics and a proprietary data network built from the flows we already serve. Each adjacency deepens the relationship with existing customers while expanding the total addressable market over time. This is how infrastructure compounds into a platform: the core earns trust, and that trust becomes the distribution channel for everything that follows.",
  },
];

export default function ThesisDetailSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Investment Thesis
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            The complete investment thesis.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Nine pillars define why we believe Baalvion is positioned to become
            the operating system beneath global B2B trade. Read together, they
            move from the structural problem in cross-border commerce to the
            compounding advantages of building the connective infrastructure to
            solve it. Forward-looking statements reflect our conviction and are
            illustrative, not financial guidance.
          </p>
        </div>

        <ol className="mt-16 space-y-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li
                key={pillar.no}
                className="group bg-white p-7 transition-colors hover:bg-gray-50 md:p-9"
              >
                <div className="flex flex-col gap-5 md:flex-row md:gap-8">
                  <div className="flex shrink-0 items-center gap-4 md:w-48 md:flex-col md:items-start md:gap-4">
                    <span className="text-4xl font-bold tracking-tight text-gray-200 transition-colors group-hover:text-primary/30 md:text-5xl">
                      {pillar.no}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-bold tracking-tight md:hidden">
                        {pillar.heading}
                      </h3>
                    </div>
                  </div>
                  <div className="md:flex-1">
                    <h3 className="hidden text-xl font-bold tracking-tight md:block">
                      {pillar.heading}
                    </h3>
                    <p className="mt-0 text-base leading-relaxed text-gray-600 md:mt-3">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-xs text-gray-400">
          Market figures reflect external estimates for global trade, the
          trade-finance gap and digitisation. Forward-looking statements describe
          the opportunity Baalvion is building toward and are not a forecast of
          company results. Offered only to qualified and accredited investors.
        </p>
      </div>
    </section>
  );
}
