import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { Cog, Mountain, Layers, Scissors, Ruler, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Capabilities",
  description:
    "Baalvion Mining's quarry capability categories — extraction, processing, crushing and screening, and custom sizing for construction and industrial applications.",
  alternates: {
    canonical: "https://mining.baalvion.com/quarry/capabilities",
  },
};

const capabilities = [
  {
    icon: Mountain,
    title: "Extraction",
    description:
      "Planned and permitted extraction of rock and aggregate from the working face, conducted under site geotechnical and safety controls.",
  },
  {
    icon: Layers,
    title: "Processing",
    description:
      "Conversion of raw quarried material into graded products through washing, separation, and quality control aligned to specification.",
  },
  {
    icon: Scissors,
    title: "Crushing & Screening",
    description:
      "Size-reduction and classification of material into defined aggregate fractions for downstream construction and industrial use.",
  },
  {
    icon: Ruler,
    title: "Custom Sizing",
    description:
      "Production of material to customer-defined gradings and specifications, supporting tailored project and supply requirements.",
  },
];

export default function QuarryCapabilitiesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Cog className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Quarry Capabilities
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our quarry operations are built around a set of core capability
              categories spanning the full path from working face to
              specification-ready product.
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

          <section aria-labelledby="capability-categories" className="space-y-6">
            <h2
              id="capability-categories"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Capability Categories
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              These categories describe the classes of work our quarry
              operations are designed to perform. Specific output figures,
              throughput, and per-site capacity are published as they are
              formally disclosed.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <Card
                    key={capability.title}
                    className="border-none shadow-sm"
                  >
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-primary/5 w-fit mb-2">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <CardTitle className="text-lg">
                        {capability.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {capability.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <PendingDisclosure label="Specific capability output figures, grades, and per-site throughput." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
