import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { HardHat, ShieldCheck, GraduationCap, ClipboardList, AlertTriangle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Safety",
  description:
    "Baalvion Mining's quarry safety commitment — a zero-harm philosophy backed by training, hazard controls, and transparent incident reporting.",
  alternates: { canonical: "https://mining.baalvion.com/quarry/safety" },
};

const programs = [
  {
    icon: ShieldCheck,
    title: "Zero-Harm Commitment",
    description:
      "We design every quarry operation around the principle that all incidents are preventable and that no task is worth an injury.",
  },
  {
    icon: GraduationCap,
    title: "Training & Competency",
    description:
      "Personnel are inducted and trained for the hazards specific to their roles, with ongoing competency development.",
  },
  {
    icon: ClipboardList,
    title: "Hazard Controls",
    description:
      "Work is governed by risk assessments, safe-work procedures, and clear controls applied at the working face and in processing.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Reporting",
    description:
      "A transparent reporting framework captures incidents and near-misses to drive corrective action and continuous improvement.",
  },
];

export default function QuarrySafetyPage() {
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
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Safety &amp; Wellbeing
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Safety is the foundation of how we operate. Our goal is simple and
              uncompromising: everyone goes home safe, every day.
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

          <section aria-labelledby="safety-commitment" className="space-y-6">
            <h2
              id="safety-commitment"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our Safety Commitment
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We are committed to building a strong safety culture across our
              quarry operations — one where hazards are identified and
              controlled, people are trained for their work, and everyone is
              empowered to stop unsafe work. The programs below describe our
              approach.
            </p>
          </section>

          <section aria-labelledby="safety-programs" className="space-y-6">
            <h2
              id="safety-programs"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Safety Programs
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {programs.map((program) => {
                const Icon = program.icon;
                return (
                  <Card key={program.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-primary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-primary"
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

          <section aria-labelledby="safety-performance" className="space-y-6">
            <h2
              id="safety-performance"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Safety Performance
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Safety performance indicators and incident statistics are reported
              as they are formally disclosed by management.
            </p>
            <PendingDisclosure label="Safety performance indicators, incident rates, and audit results." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
