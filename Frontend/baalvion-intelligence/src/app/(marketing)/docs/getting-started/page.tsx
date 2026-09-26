import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your First API Call Is 5 Minutes Away — Here's Exactly How",
  description: "Copy, paste, run: make your first request to the Baalvion Intelligence News API in under five minutes.",
  alternates: { canonical: "/docs/getting-started" },
};

const requestExample = `curl https://news.baalvion.com/v1/news?keyword=OpenAI \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

const responseExample = `{
  "success": true,
  "data": {
    "items": [
      {
        "title": "OpenAI ships GPT Enterprise with
          agentic workflow tools",
        "source": { "name": "TechCrunch", "type": "rss" },
        "category": "AI",
        "country": "US",
        "sentiment": "positive",
        "entities": [{ "name": "OpenAI", "count": 4 }],
        "published_at": "2026-07-10T08:12:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}`;

export default function GettingStartedPage() {
  return (
    <article className="prose-invert max-w-none">
      <span className="eyebrow">Getting Started</span>
      <h1>Make your first request</h1>
      <p>
        Every request to the Baalvion Intelligence API is authenticated with a bearer token tied
        to your account&apos;s API key. Create a free account to get a key, then filter articles by
        keyword, category, country, source, or sentiment.
      </p>

      <h2 className="mt-10 text-2xl">1. Get an API key</h2>
      <p>
        Sign up for a free account and generate a key from the API dashboard. Free plan keys are
        rate limited to 100 requests per day.
      </p>

      <h2 className="mt-10 text-2xl">2. Make a request</h2>
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground/90">
        <code>{requestExample}</code>
      </pre>

      <h2 className="mt-10 text-2xl">3. Read the response</h2>
      <p>Every response returns structured intelligence, not just raw article text.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground/90">
        <code>{responseExample}</code>
      </pre>
    </article>
  );
}
