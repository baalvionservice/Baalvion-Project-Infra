import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { legalEntity } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "About",
  description: "Baalvion Intelligence builds the real-time news intelligence infrastructure for AI and business.",
};

const values = [
  {
    title: "Structured over raw",
    description: "We ship entities, sentiment, and trend scores — not just article text.",
  },
  {
    title: "Speed as a feature",
    description: "Alerts land in under 60 seconds because stale intelligence isn't intelligence.",
  },
  {
    title: "Built for machines and people",
    description: "The same API that powers your dashboard powers your AI agent's context window.",
  },
];

export default function AboutPage() {
  return (
    <div className="section-container section-y">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow mx-auto w-fit justify-center">About</span>
        <h1>The Bloomberg + Google News + AI layer for developers</h1>
        <p>
          Baalvion Intelligence turns 15M+ articles a day from 50,000+ sources into structured,
          queryable intelligence — built for developers, analysts, and the AI agents they ship.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          We serve customers worldwide, from solo developers to enterprise teams, with plans billed
          in USD via Razorpay.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value.title} className="glow-card">
            <CardHeader>
              <h3 className="text-base font-semibold text-foreground">{value.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-2xl text-center text-sm text-muted-foreground">
        <p>
          Baalvion Intelligence is a product of {legalEntity.name}, incorporated in India on{" "}
          {legalEntity.incorporatedOn} (CIN: {legalEntity.cin}).
        </p>
      </div>
    </div>
  );
}
