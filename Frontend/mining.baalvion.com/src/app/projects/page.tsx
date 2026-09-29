import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  Info,
  Compass,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Our project portfolio framing and lifecycle approach. Projects will be listed here as they are formally and publicly disclosed.",
  alternates: { canonical: "https://mining.baalvion.com/projects" },
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

const lifecycle = [
  {
    title: "Exploration & Evaluation",
    desc: "Early-stage assessment of mineral potential and project feasibility.",
  },
  {
    title: "Development & Permitting",
    desc: "Project design and securing of regulatory and environmental approvals.",
  },
  {
    title: "Construction & Commissioning",
    desc: "Building and commissioning of mine and processing infrastructure.",
  },
  {
    title: "Operations",
    desc: "Active production conducted to our operational and HSE standards.",
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <FolderKanban className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Projects
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Our Project Portfolio
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Baalvion Mining Inc. is building a disciplined portfolio of mineral
              projects. Individual projects will be presented here as they are
              formally and publicly disclosed.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="projects-approach" className="space-y-4">
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="projects-approach"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Portfolio Approach
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We advance projects through a structured lifecycle, applying
              rigorous technical, environmental, and commercial assessment at
              each stage. The stages below describe how projects move from
              concept to operation.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {lifecycle.map((stage, idx) => (
                <Card key={stage.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {idx + 1}
                      </span>
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {stage.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {stage.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="project-portfolio" className="space-y-4">
            <h2
              id="project-portfolio"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Project Portfolio
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our projects, including their locations, scope, and development
              timelines, will be listed here as and when they are publicly
              disclosed in line with regulatory requirements. We do not publish
              project details ahead of formal disclosure.
            </p>
            <PendingDisclosure label="Individual project details — location, scope, capital plans, and timelines." />
          </section>

          <section aria-labelledby="projects-contact" className="space-y-4">
            <h2
              id="projects-contact"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Stay Informed
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              For project-related enquiries or partnership interest, please get
              in touch with our team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="font-bold h-12 gap-2">
                <Link href="/contact">
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
