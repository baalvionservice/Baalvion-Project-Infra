import Link from "next/link";
import { Globe, TrendingDown, Layers, Network, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Why Invest — dark hero that frames the investment case in a single screen:
// scale of the market, the AI-native technology moat, and the integrated
// platform. Market figures are external estimates, not company results.
const STAT_CHIPS = [
  { value: "$13T+", label: "Annual global B2B trade flows", icon: Globe },
  { value: "$2.5T", label: "Persistent trade-finance gap", icon: TrendingDown },
  { value: "1", label: "Unified AI-native platform", icon: Network },
  { value: "~80%", label: "Of world trade still un-digitised", icon: Layers },
];

export default function WhyInvestHero({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Why Invest in Baalvion
          </p>

          <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            An AI-native category leader building the rails of a{" "}
            <span className="text-primary">$13 trillion</span> market.
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-white/70">
            Baalvion Industries is building the AI-native operating system for global
            B2B trade — unifying logistics, trade finance and compliance on a single
            platform. The opportunity is a multi-trillion-dollar market still run on
            fragmented, paper-heavy processes, and our edge is a proprietary AI stack
            that turns that complexity into automated, defensible infrastructure.
            We are building one integrated system where today's market sells a dozen
            disconnected tools.
          </p>
        </div>

        {/* Stat chips — the investment case at a glance */}
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="bg-black p-7 transition-colors hover:bg-white/[0.03]"
            >
              <chip.icon className="h-6 w-6 text-primary" />
              <p className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
                {chip.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {chip.label}
              </p>
            </div>
          ))}
        </div>

        {/* Calls to action */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/onboarding">
              Request qualified investor access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/investment-thesis">Read the investment thesis</Link>
          </Button>
        </div>

        <p className="mt-10 max-w-3xl text-xs text-white/40">
          Market figures reflect external estimates for global trade, the
          trade-finance gap and digitisation, and represent the addressable
          opportunity Baalvion is building toward — not company financial results.
          Baalvion Industries Private Limited is privately held and unlisted;
          investor access is limited to qualified and accredited investors.
        </p>
      </div>
    </section>
  );
}
