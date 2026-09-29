import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Info,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Building2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Development",
  description:
    "Our approach to host communities — stakeholder engagement, local employment and procurement, education and skills, and infrastructure and health initiatives.",
  alternates: { canonical: "https://mining.baalvion.com/community" },
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
    icon: MessageSquare,
    title: "Stakeholder Engagement",
    body: "We are committed to open, ongoing dialogue with host communities, local authorities, and other stakeholders to understand priorities and build trust.",
  },
  {
    icon: Briefcase,
    title: "Local Employment & Procurement",
    body: "We aim to create local economic opportunity by prioritising local hiring, supplier development, and procurement from community-based businesses where practical.",
  },
  {
    icon: GraduationCap,
    title: "Education & Skills",
    body: "We are committed to supporting education and skills development that helps build capability and long-term resilience within host communities.",
  },
  {
    icon: Building2,
    title: "Infrastructure & Health",
    body: "We aim to partner on infrastructure and health initiatives that deliver lasting shared benefit beyond the life of our operations.",
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Users className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Community Development
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Partnering With Host Communities
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Baalvion Mining Inc. seeks to be a trusted, long-term partner to
              the communities around our operations, creating shared value and
              lasting positive impact.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="community-approach" className="space-y-4">
            <h2
              id="community-approach"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our Approach
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We believe responsible mining means listening to host communities
              and contributing to their long-term development. Our community
              programmes are built on engagement, local economic participation,
              and investment in education, infrastructure, and health. The focus
              areas below describe our commitments; specific programmes will be
              shared as they are established.
            </p>
          </section>

          <section aria-labelledby="community-focus" className="space-y-6">
            <h2 id="community-focus" className="sr-only">
              Focus Areas
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {focusAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <Card key={area.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-primary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-primary"
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

          <section aria-labelledby="community-programs" className="space-y-4">
            <h2
              id="community-programs"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Programmes & Investment
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Details of our specific community programmes and the investment
              behind them will be published as they are formalised.
            </p>
            <PendingDisclosure label="Specific community programmes, beneficiaries, and community investment figures." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
