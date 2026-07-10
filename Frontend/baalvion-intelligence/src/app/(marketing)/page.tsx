import Link from "next/link";
import { ArrowRight, Bot, LineChart, Megaphone, Radar, Sparkles } from "lucide-react";

import { Hero } from "@/components/hero";
import { LiveDemoWidget } from "@/components/live-demo-widget";
import { ComparisonTable } from "@/components/comparison-table";
import { TrendLeaderboard } from "@/components/trend-leaderboard";
import { PricingCards } from "@/components/pricing-cards";
import { StatBar } from "@/components/stat-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trends } from "@/lib/mock-data";

const personas = [
  {
    icon: Bot,
    title: "For AI Startups",
    description: "Give your AI agents real-time awareness of the world.",
  },
  {
    icon: LineChart,
    title: "For Businesses",
    description: "Track competitors, customers, and markets automatically.",
  },
  {
    icon: Sparkles,
    title: "For Investors",
    description: "Detect trends before they become obvious.",
  },
  {
    icon: Megaphone,
    title: "For Agencies",
    description: "Monitor brand mentions and reputation in real time.",
  },
];

const useCases = [
  { title: "AI Agent Builders", description: "Make your agents aware of breaking news." },
  { title: "Hedge Funds & Analysts", description: "Monitor sentiment shifts across thousands of companies." },
  { title: "Startups", description: "Track competitors automatically." },
  { title: "PR Teams", description: "Know when your brand is mentioned." },
];

const socialProof = [
  { value: "10M+", label: "Articles indexed" },
  { value: "50,000+", label: "Sources" },
  { value: "99.95%", label: "API uptime" },
  { value: "<300ms", label: "Avg. API response" },
];

const apiExample = `{
  "entity": "OpenAI",
  "mentions": 3512,
  "sentiment": "positive",
  "trend_score": 91,
  "summary": "OpenAI dominated AI news after shipping
    GPT Enterprise and opening a new safety-focused
    research hub."
}`;

const alertExample = `Alert me when:
  - OpenAI is mentioned
  - Tesla sentiment turns negative
  - AI funding news appears`;

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="section-container section-y" id="live-demo">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">See it work</span>
          <h2>Search any company. Get structured intelligence back.</h2>
        </div>
        <LiveDemoWidget />
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="section-container section-y">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow mx-auto w-fit justify-center">Problems we solve</span>
            <h2>Built for the people who monitor the world for a living</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {personas.map((persona) => (
              <Card key={persona.title} className="glow-card">
                <CardHeader>
                  <persona.icon className="h-8 w-8 text-primary" aria-hidden />
                  <h3 className="mt-3 text-base font-semibold text-foreground">{persona.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{persona.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container section-y">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">Why existing news APIs fail</span>
          <h2>Raw articles aren&apos;t intelligence</h2>
        </div>
        <ComparisonTable />
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="section-container section-y">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow mx-auto w-fit justify-center">The product</span>
            <h2>One API. Summaries, alerts, and trends.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="glow-card lg:col-span-1">
              <CardHeader>
                <h3 className="text-base font-semibold text-foreground">News Intelligence API</h3>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{apiExample}</code>
                </pre>
              </CardContent>
            </Card>
            <Card className="glow-card lg:col-span-1">
              <CardHeader>
                <h3 className="text-base font-semibold text-foreground">Real-Time Alerts</h3>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{alertExample}</code>
                </pre>
              </CardContent>
            </Card>
            <div className="lg:col-span-1">
              <TrendLeaderboard title="Fastest growing topics today" items={trends.slice(0, 5)} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-container section-y">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">Use cases</span>
          <h2>Built for teams that can&apos;t afford to be last to know</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="glow-card rounded-xl p-6">
              <Radar className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">{useCase.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="section-container py-14">
          <StatBar stats={socialProof} />
        </div>
      </section>

      <section className="section-container section-y">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">Pricing</span>
          <h2>Simple pricing that scales with you</h2>
        </div>
        <PricingCards compact />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need team accounts, SSO, or an SLA?{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            See the full plan comparison
          </Link>
          .
        </p>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="section-container section-y text-center">
          <h2>Stop Reading News. Start Understanding It.</h2>
          <p className="mx-auto max-w-xl">
            Build smarter AI, monitor markets, and discover trends before everyone else.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/company/contact">Book Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
