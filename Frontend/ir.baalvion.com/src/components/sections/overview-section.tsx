import Link from "next/link";
import { Button } from "@/components/ui/button";

const ROADMAP = [
  { phase: "Phase 1", title: "Foundation", desc: "Core platform across logistics, finance and compliance." },
  { phase: "Phase 2", title: "Network", desc: "Onboard shippers, financiers and partners onto one rail." },
  { phase: "Phase 3", title: "Intelligence", desc: "Data and AI for forecasting, risk and automation." },
  { phase: "Phase 4", title: "Scale", desc: "Expand corridors and deepen the global trade operating system." },
];

export default function OverviewSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-card px-3 py-1 text-sm font-medium text-primary">
              Our Vision
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Engineering the Backbone of Global Trade
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
             At Baalvion, our mission is to build and operate the foundational B2B trade ecosystem for the next century. We create value by integrating critical technologies across logistics, trade finance and compliance — turning fragmented, paper-heavy processes into a seamless, efficient and transparent operating system for global commerce.
            </p>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="#thesis">View our investment thesis <span className="ml-2">&gt;</span></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/resources/contact-ir">Contact Investor Relations</Link>
              </Button>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
            <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">Our Roadmap</p>
              <ol className="relative space-y-7 before:absolute before:left-[11px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {ROADMAP.map((r) => (
                  <li key={r.phase} className="relative flex gap-4 pl-0">
                    <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">{r.phase}</span>
                        <span className="text-base font-bold text-foreground">{r.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
