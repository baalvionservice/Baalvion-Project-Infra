"use client";

import React from "react";
import { TransparencyData } from "@/types/system";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  FileText,
  Users,
  Scale,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

/**
 * Public Platform Transparency Page Client.
 *
 * Shows the two figures Imperialpedia can actually back with real data (published
 * article count, contributor count) plus links to the platform's real, static
 * editorial/ethics/moderation policies. Earlier versions of this page rendered
 * fabricated moderation/editorial/quality charts with invented numbers and fake
 * downloadable "audit" PDFs — removed rather than wired to a backend that doesn't
 * exist, per the platform's real-data-first policy.
 *
 * Data is fetched server-side by the parent Server Component (page.tsx) and
 * passed down as a prop — this used to fetch client-side via useEffect, which
 * meant crawlers (and anyone with JS disabled) only ever saw a "Loading
 * Transparency Data..." spinner with none of the real content in the raw HTML.
 * Still a client component for the fade-in animation, but no longer for data.
 */
export function TransparencyClient({ data }: { data: TransparencyData }) {
  const header = (
    <header className="max-w-3xl space-y-4 px-2">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
        <Text
          variant="label"
          className="text-xs font-bold tracking-widest uppercase"
        >
          Platform Transparency
        </Text>
      </div>
      <Text
        variant="h1" as="h1"
        className="text-4xl lg:text-6xl font-bold tracking-tight"
      >
        Transparency Hub
      </Text>
      <Text
        variant="body"
        className="text-muted-foreground text-lg leading-relaxed"
      >
        Open governance for the global intelligence community. Below are the figures
        we can back with real data, plus the editorial and moderation policies that
        govern how Imperialpedia is run.
      </Text>
    </header>
  );

  return (
    <div className="space-y-16 pb-32 animate-in fade-in duration-700">
      {header}

      {/* REAL METRICS — only figures with an actual data source behind them */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {[
          {
            label: "Published Articles",
            value: data.metrics.articles_published.toLocaleString(),
            icon: FileText,
            color: "text-primary",
          },
          {
            label: "Contributors",
            value: data.metrics.contributors.toLocaleString(),
            icon: Users,
            color: "text-secondary",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all"
          >
            <CardContent className="p-8 flex items-center gap-6">
              <div
                className={`p-4 rounded-3xl bg-background/50 border border-white/5 shadow-inner transition-transform group-hover:scale-110 ${m.color}`}
              >
                <m.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tighter">
                  {m.value}
                </div>
                <Text
                  variant="label"
                  className="text-[10px] opacity-50 uppercase font-bold tracking-widest leading-none"
                >
                  {m.label}
                </Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GOVERNANCE POLICIES — real, static policy pages */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <Text variant="h3" className="font-bold">
              Editorial &amp; Moderation Policies
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
            >
              How Imperialpedia is governed
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.policies.map((policy) => (
            <Link key={policy.href} href={policy.href} className="group">
              <Card className="glass-card border-none shadow-xl h-full hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-8 flex items-center justify-between gap-6">
                  <div className="space-y-2">
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="text-lg group-hover:text-primary transition-colors"
                    >
                      {policy.title}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-muted-foreground leading-relaxed block"
                    >
                      {policy.description}
                    </Text>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden text-center lg:text-left">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Scale className="h-12 w-12" />
          </div>
          <div className="flex-1 space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">
              Questions About Our Governance?
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              Read our full editorial and ethics policies above, or reach out directly
              if you have a specific concern about published content or platform
              moderation.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 group"
            asChild
          >
            <Link href="/contact">
              Contact Us{" "}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
