import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Info,
  TrendingUp,
  ShieldCheck,
  Users,
  Globe,
  Mail,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Build your career with Baalvion Mining Inc. Explore our value proposition, life at Baalvion, current opportunities, and how to register your interest.",
  alternates: { canonical: "https://mining.baalvion.com/careers" },
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

const evp = [
  {
    icon: TrendingUp,
    title: "Growth & Development",
    body: "We aim to support continuous learning and meaningful career progression across technical and leadership paths.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-First Culture",
    body: "The health and safety of our people comes first in everything we do.",
  },
  {
    icon: Users,
    title: "Inclusive Workplace",
    body: "We are building a respectful, diverse, and inclusive environment where everyone can contribute.",
  },
  {
    icon: Globe,
    title: "Meaningful Impact",
    body: "Join a company committed to responsible mining and the supply of minerals essential to modern life.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Briefcase className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Careers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Build Your Career With Us
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Baalvion Mining Inc. is growing. We are looking for talented,
              committed people who share our values of safety, integrity, and
              responsible development.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="why-work-here" className="space-y-6">
            <h2
              id="why-work-here"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Why Work Here
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              We are an early-stage, ambitious mining company. That means real
              ownership, the chance to shape how we build, and a clear sense of
              purpose. The themes below reflect the kind of employer we are
              committed to being.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {evp.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-primary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="life-at-baalvion" className="space-y-4">
            <h2
              id="life-at-baalvion"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Life at Baalvion
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Details about our teams, working environment, benefits, and
              employee experience will be shared here as our organisation grows.
            </p>
            <PendingDisclosure label="Team profiles, benefits, locations, and employee stories." />
          </section>

          <section aria-labelledby="open-positions" className="space-y-4">
            <h2
              id="open-positions"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Open Positions
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-100 w-fit mx-auto">
                  <Briefcase
                    className="h-8 w-8 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No current openings
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                  We do not have any advertised vacancies at this time. We
                  welcome talented professionals to register their interest, and
                  we will reach out as suitable roles become available.
                </p>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="register-interest" className="space-y-4">
            <h2
              id="register-interest"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Register Your Interest
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Send us your CV and a short note about your background. We keep
              expressions of interest on file and consider them as new roles
              open.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="font-bold h-12 gap-2">
                <a href="mailto:careers@baalvion.com">
                  <Mail className="h-4 w-4" /> careers@baalvion.com
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="font-bold h-12 border-slate-200"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="equal-opportunity" className="space-y-3">
            <h2
              id="equal-opportunity"
              className="text-xl font-bold text-slate-900"
            >
              Equal Opportunity Employer
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
              Baalvion Mining Inc. is committed to being an equal opportunity
              employer. We make employment decisions on the basis of merit and
              do not discriminate on the basis of race, religion, gender, age,
              disability, or any other status protected by applicable law.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
