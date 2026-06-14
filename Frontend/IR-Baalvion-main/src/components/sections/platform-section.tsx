import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Banknote, ShieldCheck, BrainCircuit, Layers3, Repeat, Lock } from "lucide-react";

// The Platform — what Baalvion actually builds, and why the integrated approach is
// structurally different from the point-solutions that dominate trade today.
export default function PlatformSection({ id }: { id: string }) {
  const pillars = [
    {
      icon: Ship,
      title: "Logistics & Movement",
      desc: "Freight, shipment tracking, customs and documentation orchestrated end-to-end across borders and carriers.",
    },
    {
      icon: Banknote,
      title: "Trade Finance & Capital",
      desc: "Working capital, letters of credit, guarantees and invoice finance connected directly to the goods in motion.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance & Trust",
      desc: "AML, KYC, sanctions screening and audit-ready records built into every transaction, not bolted on afterwards.",
    },
    {
      icon: BrainCircuit,
      title: "Intelligence & Automation",
      desc: "Data and AI that turn fragmented trade events into forecasting, risk scoring and automated decisions.",
    },
  ];

  const edges = [
    {
      icon: Layers3,
      title: "One stack, not ten point solutions",
      desc: "Trade today is stitched together from dozens of disconnected vendors. Baalvion unifies the entire flow on a single platform — removing the friction, cost and risk that live in the gaps between systems.",
    },
    {
      icon: Lock,
      title: "Compliance-native by design",
      desc: "Regulatory trust is engineered into the core. That makes cross-border transactions faster and safer to underwrite — a moat competitors cannot retrofit easily.",
    },
    {
      icon: Repeat,
      title: "A compounding network effect",
      desc: "Every additional shipper, financier and partner makes the network more valuable and its data more powerful — a self-reinforcing flywheel that strengthens with scale.",
    },
  ];

  return (
    <section id={id} className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">The Platform</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-black">
            One platform. The entire trade stack.
          </h2>
          <p className="mt-4 text-gray-600 md:text-lg">
            Baalvion brings the four layers of global trade — movement, capital, trust and intelligence — onto a single, interoperable operating system. What used to require a dozen intermediaries becomes one connected flow.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <Card key={p.title} className="border-neutral-200 transition-shadow hover:shadow-lg">
              <CardHeader>
                <p.icon className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4 text-black text-lg">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 max-w-3xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-black">Why we are different</h3>
          <p className="mt-3 text-gray-600">Three structural advantages that compound over time.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          {edges.map((e, i) => (
            <div key={e.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary/30">0{i + 1}</span>
                <e.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mt-4 text-lg font-bold text-black">{e.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
