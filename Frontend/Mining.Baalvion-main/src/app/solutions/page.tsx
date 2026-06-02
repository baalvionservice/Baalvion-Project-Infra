import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, Truck, BarChart3, Users, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Solutions | Baalvion Mining Inc.",
  description:
    "End-to-end technology solutions for global mineral trade: AI compliance verification, RFQ procurement, logistics tracking, and secure escrow settlement.",
  alternates: { canonical: "https://mining.baalvion.com/solutions" },
  openGraph: {
    title: "Trade Solutions | Baalvion Mining Inc.",
    description:
      "End-to-end technology solutions for global mineral trade: AI compliance, RFQ, logistics, and secure settlement.",
    url: "https://mining.baalvion.com/solutions",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function SolutionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-24 max-w-7xl mx-auto space-y-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6">
            Industrial Solutions for Global Trade
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Baalvion Mining Inc. provides end-to-end technology solutions tailored for the mining and mineral sectors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {[
            {
              title: "Procurement Optimization",
              desc: "Digitize your supply chain with automated RFQs and competitive bidding from verified global sellers.",
              icon: <BarChart3 className="h-8 w-8 text-secondary" />
            },
            {
              title: "AI Compliance Vault",
              desc: "Automated document verification ensures all mining licenses and export permits are current and authentic.",
              icon: <ShieldCheck className="h-8 w-8 text-secondary" />
            },
            {
              title: "Global Logistics Network",
              desc: "Integrated tracking for bulk shipments across sea, rail, and land with real-time ETA updates.",
              icon: <Truck className="h-8 w-8 text-secondary" />
            },
            {
              title: "Secure Settlement",
              desc: "Escrow-based payments protect both buyers and sellers, ensuring funds are released only upon successful inspection.",
              icon: <Globe className="h-8 w-8 text-secondary" />
            }
          ].map((solution, i) => (
            <div key={i} className="flex gap-6">
              <div className="p-4 rounded-2xl bg-primary/5 h-fit shrink-0">
                {solution.icon}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-primary">{solution.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{solution.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
