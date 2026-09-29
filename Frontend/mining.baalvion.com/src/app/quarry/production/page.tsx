import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { Gauge, Mountain, Scissors, Layers, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Production",
  description:
    "Baalvion Mining's quarry production approach — the staged process that moves raw rock through extraction, processing, quality control, and dispatch.",
  alternates: { canonical: "https://mining.baalvion.com/quarry/production" },
};

const stages = [
  {
    icon: Mountain,
    title: "Drilling & Extraction",
    description:
      "Material is won from the working face under controlled, permitted methods designed for safety and resource efficiency.",
  },
  {
    icon: Scissors,
    title: "Primary Crushing",
    description:
      "Run-of-quarry rock is reduced to manageable fractions ready for further processing.",
  },
  {
    icon: Layers,
    title: "Screening & Classification",
    description:
      "Crushed material is separated into defined size fractions to meet product gradings.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Control",
    description:
      "Output is checked against customer and regulatory specifications before release.",
  },
  {
    icon: Truck,
    title: "Stockpiling & Dispatch",
    description:
      "Finished products are stockpiled and dispatched in line with supply commitments and logistics planning.",
  },
];

export default function QuarryProductionPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Gauge className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Production Approach
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our production methodology follows a disciplined sequence of
              stages — each engineered for safety, quality, and minimal
              environmental impact.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-16">
          <Link
            href="/quarry"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Quarry Operations
          </Link>

          <section aria-labelledby="process-stages" className="space-y-6">
            <h2
              id="process-stages"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Process Stages
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              From the working face to dispatch, material moves through a
              controlled production chain. The stages below describe our
              standard approach; capacity and output volumes are published as
              they are formally disclosed.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <Card key={stage.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-xl bg-secondary/5 w-fit">
                          <Icon
                            className="h-6 w-6 text-secondary"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {stage.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {stage.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="capacity" className="space-y-6">
            <h2
              id="capacity"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Production Capacity
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Annual capacity, throughput rates, and output volumes are
              site-specific and reported once formally disclosed by management.
            </p>
            <PendingDisclosure label="Production capacity, throughput rates, and annual output volumes." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
