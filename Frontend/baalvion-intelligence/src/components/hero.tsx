import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatBar } from "@/components/stat-bar";

const trustMetrics = [
  { value: "15M+", label: "Articles processed daily" },
  { value: "200+", label: "Countries covered" },
  { value: "50,000+", label: "News sources" },
  { value: "<60s", label: "Alert delivery" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/0.16),transparent_55%)]"
      />
      <div className="section-container section-y">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">Real-Time Global News Intelligence</span>
          <h1 className="mt-6">
            Turn Global News Into Actionable Intelligence in Seconds
          </h1>
          <p className="mx-auto max-w-2xl text-lg">
            Monitor companies, industries, competitors, and world events across millions of news
            articles. Get AI summaries, sentiment, trends, and real-time alerts through one simple
            API.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">
                <PlayCircle className="h-4 w-4" aria-hidden />
                Watch 2-Minute Demo
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16">
          <StatBar stats={trustMetrics} />
        </div>
      </div>
    </section>
  );
}
