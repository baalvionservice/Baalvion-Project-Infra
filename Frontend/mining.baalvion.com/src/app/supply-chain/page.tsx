import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  Pickaxe,
  Factory,
  Anchor,
  Ship,
  Network,
  ArrowRight,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Supply Chain & Logistics Network",
  description:
    "How Baalvion Mining Inc. moves material from sourcing through processing to quayside and export. Generic trade corridors are shown; partners, volumes and figures are disclosed as released.",
  alternates: { canonical: "https://mining.baalvion.com/supply-chain" },
  openGraph: {
    title: "Supply Chain & Logistics Network",
    description:
      "From sourcing through processing to quayside and export — our supply chain and logistics approach.",
    url: "https://mining.baalvion.com/supply-chain",
    siteName: "Baalvion Mining Inc.",
  },
};

// Process flow — generic stages, no fabricated partners or volumes.
const FLOW_STEPS = [
  {
    icon: <Pickaxe className="h-7 w-7 text-secondary" />,
    title: "Sourcing",
    description:
      "Material is sourced from compliant, vetted origins against agreed quality and provenance criteria.",
  },
  {
    icon: <Factory className="h-7 w-7 text-secondary" />,
    title: "Processing",
    description:
      "Run-of-mine material is processed, graded and prepared to the specifications required by the buyer.",
  },
  {
    icon: <Truck className="h-7 w-7 text-secondary" />,
    title: "Inland Haulage",
    description:
      "Processed product is moved by road, rail or multi-modal transport toward port for export.",
  },
  {
    icon: <Anchor className="h-7 w-7 text-secondary" />,
    title: "Quayside",
    description:
      "Material is staged, inspected and documented at quayside ahead of loading.",
  },
  {
    icon: <Ship className="h-7 w-7 text-secondary" />,
    title: "Export",
    description:
      "Consignments are shipped to destination markets with the documentation trade and compliance require.",
  },
];

// Generic corridor CATEGORIES only — not specific routes or contracted lanes.
const CORRIDOR_CATEGORIES = [
  "Intra-Asia",
  "Asia–Europe",
  "Asia–Middle East",
  "Africa export corridors",
  "Americas",
];

export default function SupplyChainPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Network className="h-64 w-64" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Supply Chain & Logistics
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
              Supply Chain & Logistics Network
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              From sourcing through processing to quayside and export, we manage
              material across each stage of the chain. Specific partners,
              corridors and volumes are disclosed as released by management.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-16">
          {/* Process diagram */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Sourcing to Export
              </h2>
              <p className="text-secondary leading-relaxed">
                A staged flow that keeps quality, compliance and documentation
                aligned from origin to destination.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
              {FLOW_STEPS.map((item, index) => (
                <div key={item.title} className="flex flex-1 items-center gap-4 lg:flex-col">
                  <Card className="border-none shadow-sm w-full flex-1">
                    <CardContent className="p-6 space-y-3 h-full">
                      <div className="p-3 rounded-2xl bg-secondary/10 w-fit">
                        {item.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                  {index < FLOW_STEPS.length - 1 && (
                    <ArrowRight
                      className="h-6 w-6 shrink-0 text-slate-300 rotate-90 lg:rotate-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Corridors + image */}
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Trade Corridor Categories
              </h2>
              <p className="text-secondary leading-relaxed">
                We operate across the corridor categories below. These are
                generic categories — specific contracted lanes, carriers and
                volumes are disclosed per engagement.
              </p>
              <div className="flex flex-wrap gap-3">
                {CORRIDOR_CATEGORIES.map((corridor) => (
                  <span
                    key={corridor}
                    className="px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-medium"
                  >
                    {corridor}
                  </span>
                ))}
              </div>
              <PendingDisclosure label="Logistics partners, corridor specifics and shipment volumes are pending company disclosure." />
              <div className="pt-1">
                <Link
                  href="/logistics"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Explore our logistics network <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={BRAND_IMAGES.globalNetwork}
                alt="Global logistics and trade network representation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl bg-slate-50 border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-primary">
                Plan a Shipment With Us
              </h2>
              <p className="text-secondary leading-relaxed">
                Talk to our team about sourcing, processing and export across the
                corridors we serve.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact">
                <Button className="font-bold h-12 px-8">Contact Our Team</Button>
              </Link>
              <Link href="/logistics">
                <Button variant="outline" className="font-bold h-12 px-8 border-slate-300 text-slate-600">
                  View Logistics
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
