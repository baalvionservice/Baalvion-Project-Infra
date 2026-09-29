import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat2, Coins, CreditCard, LayoutGrid, Sparkles } from "lucide-react";

// Business Model — how Baalvion creates and compounds value. Describes the revenue
// architecture and scaling logic at a strategic level (no specific financial figures).
export default function BusinessModelSection({ id }: { id: string }) {
  const streams = [
    {
      icon: Repeat2,
      title: "Transaction & platform fees",
      desc: "A usage-based fee on the trade volume orchestrated across the platform — scaling directly with the value of commerce it enables.",
    },
    {
      icon: CreditCard,
      title: "Trade-finance facilitation",
      desc: "Margin earned on connecting verified trade to capital — letters of credit, guarantees, working capital and invoice finance.",
    },
    {
      icon: LayoutGrid,
      title: "Enterprise subscriptions",
      desc: "Recurring SaaS revenue from logistics, compliance and treasury modules adopted by enterprises and trade ecosystems.",
    },
    {
      icon: Sparkles,
      title: "Data & intelligence",
      desc: "Premium analytics, risk scoring and forecasting built on the proprietary trade data flowing through the network.",
    },
  ];

  return (
    <section id={id} className="w-full bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">The Business Model</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-black">
            How we create — and compound — value
          </h2>
          <p className="mt-4 text-gray-600 md:text-lg">
            Baalvion monetises the flow of global trade across four reinforcing revenue engines, designed to grow with every transaction, partner and market we add.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {streams.map((s) => (
            <Card key={s.title} className="bg-white border-neutral-200 transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4 text-black text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-neutral-200 bg-white p-8 md:flex-row md:justify-between md:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <Coins className="h-7 w-7 text-primary" />
              <h3 className="text-xl md:text-2xl font-bold text-black">Capital-light, network-driven scaling</h3>
            </div>
            <p className="mt-3 text-gray-600">
              Rather than owning ships, warehouses or balance-sheet risk, Baalvion connects and orchestrates the participants who do — earning recurring, compounding economics as the network grows. Each layer reinforces the others, turning scale into a durable competitive advantage.
            </p>
          </div>
          <div className="shrink-0 text-center">
            <p className="text-5xl font-bold tracking-tight text-black">4×</p>
            <p className="mt-1 text-sm text-gray-500">reinforcing<br />revenue engines</p>
          </div>
        </div>
      </div>
    </section>
  );
}
