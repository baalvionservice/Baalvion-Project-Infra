import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  LineChart,
  Scale,
  Percent,
  Users,
  Repeat,
  Wallet,
  Layers,
} from "lucide-react";

// Financials — illustrative financial framework for a pre-revenue / early-stage
// company. Every figure below is a forward-looking model used to frame the
// shape of the opportunity. None of it represents reported or audited results.
// All data visualisations are inline CSS (no chart libraries).

const REVENUE_BARS = [
  { year: "Y1", h: 12 },
  { year: "Y2", h: 28 },
  { year: "Y3", h: 48 },
  { year: "Y4", h: 72 },
  { year: "Y5", h: 100 },
];

const ARR_BARS = [
  { year: "Y1", h: 16 },
  { year: "Y2", h: 34 },
  { year: "Y3", h: 55 },
  { year: "Y4", h: 78 },
  { year: "Y5", h: 100 },
];

// Two overlapping series telling the path-to-profitability story: revenue scaling
// while operating cost growth flattens, crossing at an illustrative break-even.
const PROFIT_SERIES = [
  { year: "Y1", revenue: 14, cost: 60 },
  { year: "Y2", revenue: 30, cost: 70 },
  { year: "Y3", revenue: 52, cost: 78 },
  { year: "Y4", revenue: 80, cost: 84 },
  { year: "Y5", revenue: 100, cost: 88 },
];
const BREAK_EVEN_INDEX = 3; // around Y4 in this illustrative model

const MARGIN_TREND = [
  { year: "Y1", pct: 55 },
  { year: "Y2", pct: 62 },
  { year: "Y3", pct: 69 },
  { year: "Y4", pct: 74 },
  { year: "Y5", pct: 78 },
];

const UNIT_ECONOMICS = [
  {
    icon: Scale,
    metric: "≥ 4.0x",
    label: "LTV / CAC",
    note: "Illustrative target as corridors mature and retention compounds.",
  },
  {
    icon: Wallet,
    metric: "< 14 mo",
    label: "CAC payback",
    note: "Illustrative target for blended customer acquisition payback.",
  },
  {
    icon: Layers,
    metric: "~ 65%",
    label: "Contribution margin",
    note: "Illustrative target at scale across blended revenue streams.",
  },
  {
    icon: Repeat,
    metric: "> 120%",
    label: "Net revenue retention",
    note: "Illustrative target as accounts expand volume and product depth.",
  },
];

const CUSTOMER_BARS = [
  { year: "Y1", h: 18 },
  { year: "Y2", h: 36 },
  { year: "Y3", h: 57 },
  { year: "Y4", h: 80 },
  { year: "Y5", h: 100 },
];

const RETURN_SCENARIOS = [
  { label: "Conservative", note: "Slower corridor adoption; value concentrated in core SaaS economics." },
  { label: "Base", note: "Multi-stream compounding as transaction and trade-finance volume scales." },
  { label: "Upside", note: "Infrastructure positioning plus optionality across adjacent products." },
];

export default function FinancialsSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Financial Framework
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Engineered for durable, compounding economics.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Baalvion is an early-stage company. The figures below are{" "}
            <span className="font-semibold text-black">illustrative financial models</span>{" "}
            built to frame how the business is designed to compound across SaaS
            subscriptions, per-transaction fees and trade-finance economics. They
            are forward-looking constructs — not historical results, audited
            metrics, or a forecast of future performance.
          </p>
        </div>

        {/* Revenue + ARR */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">Revenue growth</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                How blended revenue is modelled to scale as corridors and
                customers compound.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-end justify-between gap-3 sm:gap-4">
                {REVENUE_BARS.map((b) => (
                  <div
                    key={b.year}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
                    style={{ height: `${b.h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-3 sm:gap-4">
                {REVENUE_BARS.map((b) => (
                  <span key={b.year} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {b.year}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">Illustrative revenue trajectory — not a forecast.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LineChart className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">ARR trajectory</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Annual recurring revenue build as subscription and platform
                volume accumulate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-end justify-between gap-2 sm:gap-3">
                {ARR_BARS.map((b) => (
                  <div key={b.year} className="flex flex-1 flex-col justify-end">
                    <div
                      className="rounded-t-sm bg-gradient-to-t from-primary/25 to-primary/90"
                      style={{ height: `${b.h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-2 sm:gap-3">
                {ARR_BARS.map((b) => (
                  <span key={b.year} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {b.year}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">Illustrative ARR build — not a forecast.</p>
            </CardContent>
          </Card>
        </div>

        {/* Path to profitability + Gross margin */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">Path to profitability</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Revenue scaling while operating-cost growth flattens, crossing at
                an illustrative break-even.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative flex h-44 items-end justify-between gap-3 sm:gap-5">
                {PROFIT_SERIES.map((p, i) => (
                  <div key={p.year} className="relative flex flex-1 items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t-sm bg-primary"
                      style={{ height: `${p.revenue}%` }}
                      title="Revenue"
                    />
                    <div
                      className="w-1/2 rounded-t-sm bg-neutral-300"
                      style={{ height: `${p.cost}%` }}
                      title="Operating cost"
                    />
                    {i === BREAK_EVEN_INDEX && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                        Break-even
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-3 sm:gap-5">
                {PROFIT_SERIES.map((p) => (
                  <span key={p.year} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {p.year}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-neutral-300" /> Operating cost
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Illustrative operating model — break-even timing and shape are not
                guaranteed.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">Gross margin trend</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Software-like margins as the platform scales and fixed
                infrastructure is leveraged.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-end justify-between gap-3 sm:gap-4">
                {MARGIN_TREND.map((m) => (
                  <div key={m.year} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-bold text-black">{m.pct}%</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary"
                      style={{ height: `${m.pct}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-3 sm:gap-4">
                {MARGIN_TREND.map((m) => (
                  <span key={m.year} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {m.year}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">
                Illustrative gross-margin expansion from ~55% toward ~78% — not a
                forecast.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Unit economics */}
        <div className="mt-12">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">Unit economics</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            The targets below describe the unit-economics envelope the business is
            designed to operate within at scale. They are illustrative targets, not
            achieved metrics.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {UNIT_ECONOMICS.map((u) => (
              <div key={u.label} className="bg-white p-6">
                <u.icon className="h-6 w-6 text-primary" />
                <p className="mt-5 text-3xl md:text-4xl font-bold tracking-tight">{u.metric}</p>
                <p className="mt-2 text-sm font-semibold text-black">{u.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{u.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer growth + Investor returns framework */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5">
          <Card className="bg-gray-50 border-neutral-200 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">Customer growth</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Modelled account growth as corridor coverage and partnerships
                expand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
                {CUSTOMER_BARS.map((b) => (
                  <div
                    key={b.year}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
                    style={{ height: `${b.h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-2 sm:gap-3">
                {CUSTOMER_BARS.map((b) => (
                  <span key={b.year} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {b.year}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">Illustrative customer growth — not a forecast.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-neutral-200 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle className="text-black">Investor returns framework</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                How we think value can be created over time — a framework, not a
                promise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-700">
                We believe long-term value is driven by three forces: (1){" "}
                <span className="font-semibold text-black">infrastructure positioning</span>{" "}
                that supports multiple expansion as the platform becomes embedded in
                global trade; (2){" "}
                <span className="font-semibold text-black">revenue compounding</span>{" "}
                across SaaS, transaction and trade-finance streams; and (3){" "}
                <span className="font-semibold text-black">optionality</span> from
                adjacent products built on the same data and rails.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {RETURN_SCENARIOS.map((s) => (
                  <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-sm font-bold text-black">{s.label}</p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{s.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-gray-500">
                The scenarios above are illustrative framing devices only. They are
                <span className="font-semibold text-gray-700"> not projections of returns</span>,
                not a promise of performance, and no specific outcome is implied or
                guaranteed. Investments in early-stage private companies are
                illiquid and carry the risk of total loss.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Master disclaimer */}
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-gray-50 p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            Important disclosures
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            All figures, charts and scenarios on this page are{" "}
            <span className="font-semibold text-black">illustrative and forward-looking</span>.
            Baalvion Industries Private Limited is an early-stage, pre-revenue
            company; nothing here represents reported, audited, or historical
            financial results. Forward-looking models involve known and unknown
            risks and assumptions, and actual outcomes may differ materially. None
            of this content is a forecast, an offer, investment advice, or a
            guarantee of results or returns. Baalvion is privately held and
            unlisted; any investment opportunity is intended solely for qualified
            and accredited investors and is subject to the risks of illiquid,
            early-stage private investments, including the risk of total loss.
          </p>
        </div>
      </div>
    </section>
  );
}
