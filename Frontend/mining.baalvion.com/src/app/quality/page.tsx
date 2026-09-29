import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Microscope,
  FlaskConical,
  ClipboardCheck,
  ShieldCheck,
  ScrollText,
  GitBranch,
  CheckCircle2,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Quality Control & Assurance",
  description:
    "Baalvion Mining Inc.'s quality control and assurance approach — sampling, laboratory testing, third-party inspection, traceability and documentation. Specific metrics and certifications are disclosed as released.",
  alternates: { canonical: "https://mining.baalvion.com/quality" },
  openGraph: {
    title: "Quality Control & Assurance",
    description:
      "Our quality approach — sampling, testing, third-party inspection, traceability and documentation.",
    url: "https://mining.baalvion.com/quality",
    siteName: "Baalvion Mining Inc.",
  },
};

// Policy / process language only — no fabricated metrics, pass rates or certs.
const QUALITY_PILLARS = [
  {
    icon: <Microscope className="h-7 w-7 text-secondary" />,
    title: "Representative Sampling",
    description:
      "Material is sampled using documented, representative procedures so that test results reflect the consignment they describe.",
  },
  {
    icon: <FlaskConical className="h-7 w-7 text-secondary" />,
    title: "Laboratory Testing",
    description:
      "Samples are tested against agreed parameters for grade, composition and physical characteristics relevant to the product.",
  },
  {
    icon: <ClipboardCheck className="h-7 w-7 text-secondary" />,
    title: "Third-Party Inspection",
    description:
      "Independent inspection and assay can be arranged at agreed points to give counterparties confidence in declared quality.",
  },
  {
    icon: <GitBranch className="h-7 w-7 text-secondary" />,
    title: "Traceability",
    description:
      "Consignments are tracked through the chain so that quality records can be tied back to their source and handling history.",
  },
  {
    icon: <ScrollText className="h-7 w-7 text-secondary" />,
    title: "Documentation",
    description:
      "Quality outcomes are captured in documentation that accompanies the material and supports trade and compliance requirements.",
  },
  {
    icon: <ShieldCheck className="h-7 w-7 text-secondary" />,
    title: "Continuous Assurance",
    description:
      "Procedures are reviewed and improved so that quality control remains aligned with customer and regulatory expectations.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Sampling",
    description: "Representative samples are drawn under documented procedures.",
  },
  {
    step: "02",
    title: "Testing",
    description: "Samples are analysed against agreed quality parameters.",
  },
  {
    step: "03",
    title: "Inspection",
    description: "Independent inspection or assay is arranged where required.",
  },
  {
    step: "04",
    title: "Documentation",
    description: "Results are recorded and travel with the consignment.",
  },
];

export default function QualityPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Microscope className="h-64 w-64" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quality Control & Assurance
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
              Quality Control & Assurance
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Quality is built into how we sample, test, inspect, trace and
              document the materials we handle. Specific metrics and
              certifications are published as released by management.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-16">
          {/* Pillars */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                How We Assure Quality
              </h2>
              <p className="text-secondary leading-relaxed">
                The principles below describe our standard approach. They are
                policy commitments, not performance claims.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {QUALITY_PILLARS.map((pillar) => (
                <Card key={pillar.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 rounded-2xl bg-secondary/10 w-fit">
                      {pillar.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Process diagram */}
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                The Quality Workflow
              </h2>
              <ol className="space-y-4">
                {PROCESS_STEPS.map((item, index) => (
                  <li key={item.step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {item.step}
                      </span>
                      {index < PROCESS_STEPS.length - 1 && (
                        <span className="mt-1 h-full w-px flex-1 bg-slate-200" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pb-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={BRAND_IMAGES.mineral}
                alt="Mineral samples representative of quality testing and assurance"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </section>

          {/* Certifications & metrics — pending */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-secondary" />
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Certifications & Metrics
              </h2>
            </div>
            <p className="text-secondary leading-relaxed max-w-3xl">
              Independent certifications, accreditation references and measured
              quality metrics are published here once issued and verified.
            </p>
            <PendingDisclosure label="Certifications, accreditation references and quality metrics are pending company disclosure." />
            <div className="pt-2">
              <Link href="/contact">
                <Button className="font-bold h-12 px-10">
                  Request Quality Documentation
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
