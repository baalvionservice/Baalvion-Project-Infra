import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mountain,
  Info,
  Layers,
  Cog,
  ShieldCheck,
  Gem,
  Factory,
  Compass,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mining Operations",
  description:
    "Our operational approach to responsible mineral development — site operations, mineral portfolio categories, production methodology, and operational standards.",
  alternates: { canonical: "https://mining.baalvion.com/operations" },
};

function PendingDisclosure({ label }: { label?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-6 flex items-start gap-3 text-slate-500">
      <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-slate-600">
          Information pending company disclosure.
        </p>
        {label ? (
          <p className="text-xs text-slate-400 mt-1">{label}</p>
        ) : null}
      </div>
    </div>
  );
}

const mineralCategories = [
  {
    icon: Layers,
    title: "Base & Ferrous Metals",
    description:
      "Commodity categories spanning iron ore and common industrial base-metal feedstocks, evaluated against responsible-sourcing criteria.",
  },
  {
    icon: Gem,
    title: "Critical & Strategic Minerals",
    description:
      "Minerals identified as strategically important for energy transition and advanced manufacturing supply chains.",
  },
  {
    icon: Mountain,
    title: "Industrial & Bulk Minerals",
    description:
      "Bulk and industrial mineral categories used across construction, refractory, and processing applications.",
  },
];

const operationalStandards = [
  {
    title: "Responsible Extraction",
    description:
      "Operations are designed around safety-first practices, regulatory compliance, and environmental stewardship.",
  },
  {
    title: "Compliance & Governance",
    description:
      "Activities are conducted in accordance with applicable Indian mining, environmental, and corporate regulations.",
  },
  {
    title: "Continuous Improvement",
    description:
      "We pursue operational excellence through ongoing review of process efficiency, safety, and sustainability.",
  },
];

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Mountain className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Mining Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Responsible Mineral Development
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Baalvion Mining Inc. approaches mineral development with a
              commitment to safety, regulatory compliance, and long-term
              environmental and social responsibility.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-16">
          <section aria-labelledby="our-operations" className="space-y-6">
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="our-operations"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Our Operations
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our operational footprint is being established in line with our
              corporate strategy and regulatory approvals. As operations are
              commissioned and publicly disclosed, this section will provide an
              overview of our active sites, mineral portfolio, and operational
              capabilities.
            </p>
            <PendingDisclosure label="Site map and operational portfolio overview." />
          </section>

          <section aria-labelledby="mineral-portfolio" className="space-y-6">
            <div className="flex items-center gap-3">
              <Gem className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="mineral-portfolio"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Mineral Portfolio
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our focus spans the following broad commodity categories. These
              represent the classes of minerals within our area of interest.
              Specific assets, reserves, and resource statements will be
              published as they are formally disclosed.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mineralCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card key={cat.title} className="border-none shadow-sm">
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-primary/5 w-fit mb-2">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <CardTitle className="text-lg">{cat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {cat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <PendingDisclosure label="Specific mineral assets, grades, and resource statements." />
          </section>

          <section aria-labelledby="production-approach" className="space-y-6">
            <div className="flex items-center gap-3">
              <Factory className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="production-approach"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Production Approach
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our production methodology is built around proven mineral
              processing principles: extraction, beneficiation, and quality
              control aligned to customer and regulatory specifications. We
              prioritise resource efficiency and minimal environmental impact
              throughout the value chain.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Cog,
                  title: "Extraction",
                  desc: "Planned and permitted extraction conducted to industry safety and environmental norms.",
                },
                {
                  icon: Layers,
                  title: "Processing & Beneficiation",
                  desc: "Beneficiation to meet product grade and quality specifications.",
                },
                {
                  icon: ShieldCheck,
                  title: "Quality Assurance",
                  desc: "Quality control aligned with customer and regulatory requirements.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-secondary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-secondary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <PendingDisclosure label="Production capacity, output volumes, and processing throughput figures." />
          </section>

          <section aria-labelledby="operational-standards" className="space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
              <h2
                id="operational-standards"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Operational Standards
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {operationalStandards.map((std) => (
                <Card key={std.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {std.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {std.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
