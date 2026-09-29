import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake,
  Info,
  GraduationCap,
  Stethoscope,
  Sprout,
  Droplets,
  Scale,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSR Activities",
  description:
    "Our Corporate Social Responsibility philosophy, focus areas, and governance — aligned to the CSR framework under Section 135 of the Companies Act, 2013 (India).",
  alternates: { canonical: "https://mining.baalvion.com/csr" },
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

const focusAreas = [
  {
    icon: GraduationCap,
    title: "Education",
    body: "Supporting access to quality education and learning opportunities in our areas of operation.",
  },
  {
    icon: Stethoscope,
    title: "Health & Sanitation",
    body: "Promoting community health, sanitation, and access to basic healthcare services.",
  },
  {
    icon: Sprout,
    title: "Livelihood & Skills",
    body: "Enabling sustainable livelihoods through skills development and economic empowerment.",
  },
  {
    icon: Droplets,
    title: "Environment & Water",
    body: "Contributing to environmental sustainability and water conservation initiatives.",
  },
];

export default function CsrPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <HeartHandshake className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              CSR Activities
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Corporate Social Responsibility
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Giving back is integral to how Baalvion Mining Inc. operates. Our
              CSR efforts are guided by the statutory framework for corporate
              social responsibility in India and our own commitment to inclusive
              development.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="csr-philosophy" className="space-y-4">
            <h2
              id="csr-philosophy"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our CSR Philosophy
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We view corporate social responsibility as a long-term commitment
              to the wellbeing of the communities and environment connected to
              our operations. Our CSR activities are designed and governed in
              alignment with{" "}
              <span className="font-semibold text-slate-700">
                Section 135 of the Companies Act, 2013
              </span>{" "}
              and the Companies (CSR Policy) Rules, which provide the governing
              framework for corporate social responsibility in India.
            </p>
          </section>

          <section aria-labelledby="csr-focus" className="space-y-6">
            <h2
              id="csr-focus"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Focus Areas
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {focusAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <Card key={area.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-secondary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-secondary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {area.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {area.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="csr-governance" className="space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="csr-governance"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Governance of CSR
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our CSR activities are intended to be overseen in accordance with
              the statutory governance requirements, including a Board-level CSR
              policy and committee structure where applicable, with transparent
              reporting of activities and expenditure.
            </p>
            <PendingDisclosure label="Specific CSR projects, budgets, expenditure, and annual CSR reports." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
