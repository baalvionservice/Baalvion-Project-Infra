export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "AI" | "Business" | "News Intelligence" | "Product Updates" | "Engineering";
  date: string;
  readTime: string;
  body: string[];
}

// Every claim below is grounded in the actual news-service / developer-service code, not
// invented metrics. No LLM, no fabricated scale numbers — see the source comments this content
// is drawn from (service/enrichmentService.js, workers/ingestionWorker.js, services/apiKeyService.js,
// controllers/billingController.js).
export const blogPosts: BlogPost[] = [
  {
    slug: "why-we-poll-instead-of-pretending-to-stream",
    title: "Why We Poll Instead of Pretending to Stream",
    excerpt:
      "\"Real-time\" gets thrown around a lot in this space. Here's exactly how our ingestion pipeline actually works, and why polling on a per-source interval is the honest architecture.",
    category: "Engineering",
    date: "2026-09-22",
    readTime: "5 min",
    body: [
      "A lot of news APIs market themselves as \"real-time\" without saying what that actually means under the hood. Ours works like this: every source in our registry (RSS feeds, government press releases, industry feeds) has its own poll_interval_minutes, defaulting to 15 minutes for new sources. A scheduler checks every 5 minutes for any source that's due, fetches it, and parses new items.",
      "That means the freshest an article can appear is bounded by how often we check that specific source, not some fixed sub-minute guarantee. High-priority sources can be configured to poll as often as once a minute; most run on the 15-minute default because that's a sane balance between freshness and not hammering a publisher's feed.",
      "We'd rather tell you the real number than round it down to sound impressive. If you're building an alerting product on top of this API, design for \"minutes,\" not \"seconds\" — and if you need faster coverage on a specific source, that's a config change we can make, not a marketing promise we can't keep.",
    ],
  },
  {
    slug: "how-our-sentiment-engine-works",
    title: "How Our Sentiment Engine Actually Works (No LLM, On Purpose)",
    excerpt:
      "Sentiment scoring on every article isn't an LLM call — it's a deterministic lexicon scorer. Here's why we built it that way and what it can and can't tell you.",
    category: "Engineering",
    date: "2026-09-15",
    readTime: "4 min",
    body: [
      "Every enriched article gets a sentiment label: positive, neutral, or negative. It's tempting to assume that's an LLM doing nuanced reasoning about tone. It isn't. It's a compact, domain-tuned lexicon scorer — a curated list of positive words (surge, growth, breakthrough, profitable) and negative words (crash, lawsuit, layoffs, bankruptcy) counted against the article text.",
      "That's a deliberate tradeoff. A lexicon scorer is fast, deterministic, and auditable — you can see exactly why an article scored the way it did. A general-purpose sentiment model trained on unrelated text would give you false precision on financial and tech news specifically, which is worse than an honestly modest scorer.",
      "What it's good at: flagging a clear negative-news spike on a company you're tracking. What it's not: detecting sarcasm, nuance, or mixed sentiment within a single article. If your use case needs that level of nuance, treat our sentiment field as a fast first-pass signal, not a final verdict.",
    ],
  },
  {
    slug: "entity-extraction-without-a-black-box",
    title: "Entity Extraction Without a Black Box",
    excerpt:
      "How we tag companies, people, and products in every article — proper-noun-phrase detection and frequency ranking, not a mystery model you have to trust blindly.",
    category: "Engineering",
    date: "2026-09-08",
    readTime: "4 min",
    body: [
      "Entity tagging on our articles works by detecting proper-noun phrases in the text and ranking them by frequency within the article. No named-entity-recognition model, no external API call — just a transparent, rule-based pass over the text.",
      "The upside is you can reproduce and audit every entity we surface. The tradeoff is it's a frequency signal, not true disambiguation — if an article mentions both \"Apple\" the company and someone eating an apple, our extractor doesn't know the difference from text patterns alone (in practice, this is rare in news copy, but it's worth knowing).",
      "We're building toward a proper entity graph that resolves and links entities across articles — companies, people, and products as first-class objects rather than just extracted strings. Until that ships, what you get today is the honest, current version: real extraction, clearly scoped limitations.",
    ],
  },
  {
    slug: "every-api-key-is-a-hash-not-a-password",
    title: "Every API Key Is a Hash, Not a Password We Can Read",
    excerpt:
      "How API key issuance, storage, and verification actually work — and why we can't show you your key again after the first time.",
    category: "Product Updates",
    date: "2026-08-27",
    readTime: "3 min",
    body: [
      "When you generate an API key, we show it to you exactly once, in full. After that, we store only a SHA-256 hash of it, plus a public prefix and the last 4 characters — enough for you to recognize which key is which in your dashboard, not enough for anyone (including us) to reconstruct the original token.",
      "Verification on every request is a prefix lookup followed by a constant-time hash comparison, which avoids timing side-channels. Keys carry their own scopes, an optional expiry, and a per-key rate limit, so you can issue narrower keys for different parts of your system instead of sharing one god-key across your whole stack.",
      "If you lose a key, there's no \"recover it\" flow — because we genuinely don't have it. You rotate it and update your integration. That's the same standard we'd want from any vendor handling our own credentials.",
    ],
  },
  {
    slug: "inside-our-billing-pipeline",
    title: "Inside Our Billing Pipeline: Signed Webhooks, No Guesswork",
    excerpt:
      "Checkout runs through Razorpay with HMAC-verified webhooks. Here's what happens between clicking \"Upgrade\" and your plan actually changing.",
    category: "Product Updates",
    date: "2026-08-14",
    readTime: "4 min",
    body: [
      "Upgrading a plan creates a Razorpay order server-side, scoped to your organization and the plan you selected. When payment completes, Razorpay calls our webhook endpoint directly — and we verify every incoming webhook by recomputing the HMAC-SHA256 signature over the raw request body with our webhook secret, using a constant-time comparison before trusting anything in the payload.",
      "We deliberately ack every webhook with a 200 even if our internal handler throws, logging the failure for manual reconciliation instead of letting Razorpay's retry logic hammer an already-charged customer's account. Payment failures get investigated by a human, not silently retried into a mess.",
      "None of this is mocked in production — there's no fake-payment mode wired into the live checkout flow. What you see in the billing dashboard reflects real orders against a real payment processor.",
    ],
  },
  {
    slug: "what-our-news-feed-actually-covers-today",
    title: "What Our News Feed Actually Covers Today",
    excerpt:
      "No inflated source counts. Here's the honest, current breakdown of what we ingest — tech, business, legal, finance, and government feeds across the US, UK, and EU.",
    category: "News Intelligence",
    date: "2026-07-30",
    readTime: "3 min",
    body: [
      "Our source registry today spans technology (TechCrunch, The Verge, Wired, MIT News AI desk), general and business news (BBC World, BBC Business, MarketWatch, CNBC, Yahoo Finance), cybersecurity (Krebs on Security, The Hacker News), science (ScienceDaily, NASA), and legal (JURIST, SCOTUSblog, Above the Law).",
      "It also pulls directly from government and regulatory feeds: the US Department of Justice, FTC, SEC, Federal Reserve, Bureau of Labor Statistics, CFPB, FDA and CPSC recall feeds, plus the European Central Bank, European Commission, UK ONS, and HM Treasury.",
      "That's a real, growing, but modest-sized registry — not tens of thousands of sources. We'd rather you know exactly what's covered before you build on it than discover a gap after you've shipped. New sources get added as customers ask for coverage we don't have yet.",
    ],
  },
];
