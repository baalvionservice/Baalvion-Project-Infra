import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Info, Users, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Environmental, Social & Governance",
  description:
    "Our ESG framework across three pillars — environmental stewardship, social responsibility, and strong governance.",
  alternates: { canonical: "https://mining.baalvion.com/esg" },
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
    icon: Leaf,
    title: "Environmental",
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
    intro:
      "We are committed to minimising our environmental impact and contributing to a sustainable, low-carbon future.",
    topics: [
      {
        name: "Climate & Emissions",
        desc: "Managing our energy use and greenhouse-gas footprint across operations.",
      },
      {
        name: "Water & Biodiversity",
        desc: "Responsible water stewardship and protection of local ecosystems.",
      },
      {
        name: "Tailings & Rehabilitation",
        desc: "Safe tailings management and progressive rehabilitation of disturbed land.",
      },
    ],
  },
  {
    icon: Users,
    title: "Social",
    accent: "text-primary",
    bg: "bg-primary/5",
    intro:
      "We are committed to operating responsibly and creating shared value with our people and host communities.",
    topics: [
      {
        name: "Human Rights",
        desc: "Respecting human rights across our operations and supply chain.",
      },
      {
        name: "Labour & Workforce",
        desc: "Fair labour practices, diversity, and a safe, inclusive workplace.",
      },
      {
        name: "Communities",
        desc: "Meaningful engagement and development partnerships with host communities.",
      },
    ],
  },
  {
    icon: Scale,
    title: "Governance",
    accent: "text-secondary",
    bg: "bg-secondary/5",
    intro:
      "We are committed to operating with integrity, transparency, and strong accountability.",
    topics: [
      {
        name: "Board Oversight",
        desc: "Clear governance structures with oversight of strategy and risk.",
      },
      {
        name: "Ethics & Compliance",
        desc: "A culture of ethical conduct and compliance with applicable law.",
      },
      {
        name: "Transparency",
        desc: "Honest, timely, and transparent disclosure to our stakeholders.",
      },
    ],
  },
];

export default function EsgPage() {
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
              Environmental, Social &amp; Governance
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Sustainable & Responsible Mining
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              ESG principles are central to the way Baalvion Mining Inc. builds
              its business — balancing environmental stewardship, social
              responsibility, and disciplined governance.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="esg-framework" className="space-y-4">
            <h2
              id="esg-framework"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our ESG Framework
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Our ESG framework is organised around three pillars. It guides how
              we identify and manage material risks and opportunities and how we
              hold ourselves accountable. Specific targets, metrics, and ratings
              will be published as our reporting matures.
            </p>
          </section>

          <section aria-labelledby="esg-pillars" className="space-y-8">
            <h2 id="esg-pillars" className="sr-only">
              ESG Pillars
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <Card key={pillar.title} className="border-none shadow-sm">
                    <CardHeader>
                      <div className={`p-3 rounded-xl ${pillar.bg} w-fit mb-2`}>
                        <Icon
                          className={`h-6 w-6 ${pillar.accent}`}
                          aria-hidden="true"
                        />
                      </div>
                      <CardTitle className="text-xl">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {pillar.intro}
                      </p>
                      <ul className="space-y-3">
                        {pillar.topics.map((topic) => (
                          <li key={topic.name}>
                            <h3 className="text-sm font-bold text-slate-900">
                              {topic.name}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {topic.desc}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="esg-targets" className="space-y-4">
            <h2
              id="esg-targets"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Targets, Metrics & Reporting
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We intend to set measurable ESG targets and report progress
              transparently against recognised frameworks.
            </p>
            <PendingDisclosure label="ESG targets, performance metrics, ratings, and disclosure reports." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
