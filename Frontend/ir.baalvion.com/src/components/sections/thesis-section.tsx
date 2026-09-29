import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Zap } from "lucide-react";

// On-brand inline data visualisations (no external chart assets) so the thesis
// reads as intentional and renders crisply at every breakpoint.
const TAM_BARS = [
  { year: "Y1", h: 28 },
  { year: "Y2", h: 42 },
  { year: "Y3", h: 58 },
  { year: "Y4", h: 76 },
  { year: "Y5", h: 100 },
];
const ALLOCATION = [
  { label: "Platform & technology", pct: 40 },
  { label: "Trade finance capacity", pct: 30 },
  { label: "Market & corridor expansion", pct: 20 },
  { label: "Reserves & governance", pct: 10 },
];

export default function ThesisSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Investment Thesis
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Our strategy is centered on creating a durable competitive moat by integrating critical infrastructure for global B2B trade.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Capture High-Growth Corridors</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600 text-left">We target trade routes and digital ecosystems experiencing exponential growth, focusing on emerging markets and technology-driven supply chains where our integrated system can provide maximum value.</p>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Acquire Strategic Technology</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600  text-left">Our M&A strategy focuses on acquiring key technologies in trade finance, compliance automation (AML/KYC), and logistics management to accelerate our platform's capabilities and market penetration.</p>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="items-start">
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-black">Build a Network Effect</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-gray-600  text-left">By integrating essential services, we create a powerful network effect. Each new partner, customer, and transaction on our platform increases its value for all other participants, creating a self-reinforcing cycle of growth.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <CardTitle className="text-black mb-2">Market Opportunity (TAM)</CardTitle>
              <CardDescription className="text-gray-500">Illustrative trajectory of our serviceable addressable market as the platform scales.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-end justify-between gap-3 sm:gap-4">
                {TAM_BARS.map((b) => (
                  <div
                    key={b.year}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all"
                    style={{ height: `${b.h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-3 sm:gap-4">
                {TAM_BARS.map((b) => (
                  <span key={b.year} className="flex-1 text-center text-xs font-medium text-gray-500">{b.year}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">Directional illustration of the addressable opportunity — not a financial forecast.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-neutral-200">
            <CardHeader>
              <CardTitle className="text-black mb-2">Capital Allocation Strategy</CardTitle>
              <CardDescription className="text-gray-500">A disciplined framework for deploying capital toward durable value.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div className="bg-primary" style={{ width: "40%" }} />
                <div className="bg-primary/70" style={{ width: "30%" }} />
                <div className="bg-primary/45" style={{ width: "20%" }} />
                <div className="bg-primary/25" style={{ width: "10%" }} />
              </div>
              <ul className="mt-6 space-y-4">
                {ALLOCATION.map((a) => (
                  <li key={a.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" style={{ opacity: a.pct / 40 }} />
                      <span className="text-sm text-gray-700">{a.label}</span>
                    </div>
                    <span className="text-sm font-bold text-black">{a.pct}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
