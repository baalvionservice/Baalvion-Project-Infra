import Link from "next/link";
import { ArrowRight, Bot, LineChart, Megaphone, Plug, Radar, Sparkles } from "lucide-react";

import { Hero } from "@/components/hero";
import { LiveDemoWidget } from "@/components/live-demo-widget";
import { ComparisonTable } from "@/components/comparison-table";
import { PricingCards } from "@/components/pricing-cards";
import { StatBar } from "@/components/stat-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchNewsService } from "@/lib/news-api.server";
import type { TrendingResponse } from "@/lib/types";

const personas = [
  {
    icon: Plug,
    title: "For AI Agent Builders",
    description: "Drop our MCP server into Claude or any MCP-compatible agent — no API glue code required.",
  },
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
  { value: "53", label: "Live news & government sources" },
  { value: "$0", label: "To start — no credit card" },
  { value: "SHA-256", label: "Hashed API keys, never stored in plaintext" },
  { value: "RS256", label: "Centralized auth, no second issuer" },
];

// Matches the real /v1/news response shape (see Article model + newsController.js) —
// no fabricated fields like "trend_score" or an AI-written summary that isn't wired up yet.
const apiExample = `{
  "title": "OpenAI ships GPT Enterprise with
    agentic workflow tools",
  "source": "TechCrunch",
  "category": "AI",
  "country": "US",
  "sentiment": "positive",
  "entities": [{ "name": "OpenAI", "count": 4 }],
  "published_at": "2026-09-24T14:02:00Z"
}`;

// Real webhook event-dispatch payload shape (developer-service webhookController.js) —
// rule-based alert conditions aren't built yet, so this shows what's actually live: your
// endpoint gets called with the matching article the moment it's ingested.
const alertExample = `POST https://your-app.com/webhooks/baalvion

{
  "eventType": "article.ingested",
  "payload": {
    "title": "OpenAI ships GPT Enterprise...",
    "category": "AI",
    "sentiment": "positive"
  }
}`;

const mcpConfigExample = `{
  "mcpServers": {
    "baalvion-intelligence": {
      "command": "npx",
      "args": ["-y", "@baalvion/news-mcp-server"],
      "env": { "BAALVION_API_KEY": "bk_live_..." }
    }
  }
}`;

export default async function HomePage() {
  let trendingCategories: TrendingResponse["items"] = [];
  try {
    const trending = (await fetchNewsService(
      "/v1/news/trending",
      new URLSearchParams({ dimension: "category" })
    )) as TrendingResponse;
    trendingCategories = trending.items.slice(0, 5);
  } catch {
    // NEWS_API_KEY not configured in this environment, or the request failed — render
    // the empty state below rather than fabricated numbers.
  }

  return (
    <>
      <Hero />

      <section className="section-container section-y" id="live-demo">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow mx-auto w-fit justify-center">See the shape of it</span>
          <h2>This is what structured intelligence looks like</h2>
        </div>
        <LiveDemoWidget />
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="section-container section-y">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow mx-auto w-fit justify-center">Problems we solve</span>
            <h2>Built for the people who monitor the world for a living</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
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
                <h3 className="text-base font-semibold text-foreground">Webhook Delivery</h3>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{alertExample}</code>
                </pre>
              </CardContent>
            </Card>
            <div className="lg:col-span-1 glow-card rounded-xl p-6">
              <p className="eyebrow mb-4">Fastest-growing categories, last 24h</p>
              {trendingCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No ranked volume yet — this fills in live once articles are ingested.
                </p>
              ) : (
                <ol className="space-y-1">
                  {trendingCategories.map((item, index) => (
                    <li
                      key={item.value ?? index}
                      className="flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-secondary/40"
                    >
                      <span className="flex items-center gap-3">
                        <span className="metric w-5 text-sm text-muted-foreground">{index + 1}</span>
                        <span className="font-medium text-foreground">{item.value}</span>
                      </span>
                      <span className="metric text-sm font-semibold text-foreground">{item.count} articles</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="section-container section-y">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow w-fit">For AI agents</span>
              <h2 className="mt-3">Ship it as an MCP server, not a fetch() call</h2>
              <p className="mt-3 text-muted-foreground">
                Add Baalvion Intelligence to Claude Desktop, Claude Code, or any MCP-compatible agent in one config
                block. Your agent gets <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">search_news</code>,{" "}
                <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">get_trending</code>, and{" "}
                <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">get_article</code> tools
                out of the box — no custom API wrapper to write or maintain.
              </p>
              <Button className="mt-6" variant="outline" asChild>
                <Link href="/docs">
                  View MCP setup docs
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <Card className="glow-card">
              <CardHeader>
                <h3 className="text-base font-semibold text-foreground">claude_desktop_config.json</h3>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{mcpConfigExample}</code>
                </pre>
              </CardContent>
            </Card>
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
