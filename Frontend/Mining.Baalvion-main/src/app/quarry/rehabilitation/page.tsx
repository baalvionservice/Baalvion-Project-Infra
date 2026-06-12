import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { Sprout, Recycle, ClipboardList, TreePine, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Rehabilitation",
  description:
    "Baalvion Mining's progressive rehabilitation and land restoration approach — closure planning and responsible post-mining land use across our quarry sites.",
  alternates: {
    canonical: "https://mining.baalvion.com/quarry/rehabilitation",
  },
};

const programs = [
  {
    icon: Recycle,
    title: "Progressive Rehabilitation",
    description:
      "Rehabilitation is planned and progressed alongside active operations, rather than deferred to the end of a site's life.",
  },
  {
    icon: TreePine,
    title: "Land Restoration",
    description:
      "Worked-out areas are reshaped, re-soiled, and revegetated to restore stability, drainage, and ecological function.",
  },
  {
    icon: ClipboardList,
    title: "Closure Planning",
    description:
      "Each site is supported by closure planning that sets out how land will be left safe, stable, and non-polluting.",
  },
  {
    icon: Sprout,
    title: "Post-Mining Land Use",
    description:
      "We plan for beneficial post-mining outcomes so that land can be returned to productive or ecological use.",
  },
];

export default function QuarryRehabilitationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Sprout className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Rehabilitation &amp; Closure
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              We treat rehabilitation as a core part of operating — restoring the
              land we work so it can be returned to safe, stable, and beneficial
              use.
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

          <section aria-labelledby="rehab-approach" className="space-y-6">
            <h2
              id="rehab-approach"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Our Rehabilitation Approach
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Rehabilitation is integral to responsible quarrying. By planning
              for restoration from the outset and progressing it alongside
              operations, we work to leave a positive legacy — land that is
              safe, stable, and suited to a beneficial future use.
            </p>
          </section>

          <section aria-labelledby="rehab-programs" className="space-y-6">
            <h2
              id="rehab-programs"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Rehabilitation Programs
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

          <section aria-labelledby="rehab-projects" className="space-y-6">
            <h2
              id="rehab-projects"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Rehabilitation Projects
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Specific rehabilitation projects, restored areas, and closure
              outcomes are published as they are formally disclosed by
              management.
            </p>
            <PendingDisclosure label="Specific rehabilitation projects, restored areas, and closure outcomes." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
