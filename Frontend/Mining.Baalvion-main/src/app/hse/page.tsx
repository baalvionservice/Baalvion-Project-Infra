import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HardHat,
  Info,
  HeartPulse,
  Leaf,
  Siren,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health, Safety & Environment",
  description:
    "Our HSE commitment — safety management, health and wellbeing, environmental management, emergency preparedness, training, and incident reporting.",
  alternates: { canonical: "https://mining.baalvion.com/hse" },
};

function PendingDisclosure({ label }: { label?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-6 flex items-start gap-3 text-slate-500">
      <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-slate-600">
          Information pending company disclosure.
        </p>
        {label ? <p className="text-xs text-slate-400 mt-1">{label}</p> : null}
      </div>
    </div>
  );
}

const pillars = [
  {
    icon: ShieldCheck,
    title: "Safety Management Framework",
    body: "We are committed to building a structured safety management system covering hazard identification, risk assessment, safe work procedures, and a culture where every person is empowered to stop unsafe work.",
  },
  {
    icon: HeartPulse,
    title: "Health & Wellbeing",
    body: "We are committed to protecting the physical and mental wellbeing of our workforce through occupational health programmes, fitness-for-work practices, and access to support services.",
  },
  {
    icon: Leaf,
    title: "Environmental Management",
    body: "We are committed to minimising our environmental footprint through responsible resource use, pollution prevention, and progressive rehabilitation of disturbed land.",
  },
  {
    icon: Siren,
    title: "Emergency Preparedness & Response",
    body: "We are committed to maintaining emergency response plans, trained response teams, and regular drills so that our people and communities are protected in the event of an incident.",
  },
  {
    icon: GraduationCap,
    title: "Training & Competency",
    body: "We are committed to ensuring every worker is trained and competent for their role, with induction, ongoing skills development, and verification of safety-critical competencies.",
  },
  {
    icon: ClipboardCheck,
    title: "Incident Reporting",
    body: "We are committed to transparent reporting and investigation of incidents and near-misses, applying lessons learned to continuously strengthen our controls.",
  },
];

export default function HsePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <HardHat className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Health, Safety &amp; Environment
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Everyone Home Safe, Every Day
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              The health and safety of our people and the protection of the
              environment are fundamental to how Baalvion Mining Inc. operates.
              We are committed to a goal of zero harm.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="hse-commitment" className="space-y-4">
            <h2
              id="hse-commitment"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our HSE Commitment
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We believe all incidents are preventable. Our approach embeds
              health, safety, and environmental responsibility into every
              decision — from planning and design through to operations and
              eventual mine closure. The framework below describes the pillars
              of our HSE programme as it is established.
            </p>
          </section>

          <section
            aria-labelledby="hse-pillars"
            className="space-y-6"
          >
            <h2 id="hse-pillars" className="sr-only">
              HSE Pillars
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <Card key={pillar.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-primary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {pillar.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="hse-performance" className="space-y-4">
            <h2
              id="hse-performance"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Performance & Metrics
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We intend to measure and transparently report our HSE performance,
              including safety indicators and environmental metrics, as our
              operations mature.
            </p>
            <PendingDisclosure label="Safety performance indicators (e.g. LTIFR), environmental metrics, and certifications." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
