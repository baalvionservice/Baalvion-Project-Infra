import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { Leaf, Wind, Droplets, Volume2, Bird, Activity, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Environmental Management",
  description:
    "Baalvion Mining's environmental management at our quarries — dust, water, and noise controls, biodiversity protection, and ongoing monitoring.",
  alternates: {
    canonical: "https://mining.baalvion.com/quarry/environmental",
  },
};

const programs = [
  {
    icon: Wind,
    title: "Dust Management",
    description:
      "Suppression and control measures applied across extraction, processing, and haul routes to manage airborne dust.",
  },
  {
    icon: Droplets,
    title: "Water Management",
    description:
      "Controls for site water, drainage, and sediment to protect surrounding watercourses and groundwater.",
  },
  {
    icon: Volume2,
    title: "Noise & Vibration",
    description:
      "Operational practices designed to manage noise and vibration impacts on neighbouring communities and the environment.",
  },
  {
    icon: Bird,
    title: "Biodiversity Protection",
    description:
      "Measures to protect habitats and species within and around our operating areas as part of responsible land management.",
  },
  {
    icon: Activity,
    title: "Monitoring",
    description:
      "Ongoing environmental monitoring to verify that controls are effective and that we operate within applicable limits.",
  },
];

export default function QuarryEnvironmentalPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Leaf className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Environmental Management
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              We work to minimise the environmental footprint of our quarry
              operations through active management of air, water, noise, and
              biodiversity — backed by ongoing monitoring.
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

          <section aria-labelledby="environmental-approach" className="space-y-6">
            <h2
              id="environmental-approach"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our Environmental Approach
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Responsible quarrying means managing impacts at every stage of the
              operation. We aim to operate within applicable environmental
              approvals and to continuously improve how we protect the land,
              water, air, and communities around our sites.
            </p>
          </section>

          <section aria-labelledby="environmental-programs" className="space-y-6">
            <h2
              id="environmental-programs"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Management Programs
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => {
                const Icon = program.icon;
                return (
                  <Card key={program.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-secondary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-secondary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {program.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {program.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="environmental-monitoring" className="space-y-6">
            <h2
              id="environmental-monitoring"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Monitoring &amp; Reporting
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Monitoring data, environmental performance results, and compliance
              reporting are published as they are formally disclosed by
              management.
            </p>
            <PendingDisclosure label="Environmental monitoring data, performance results, and compliance reporting." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
