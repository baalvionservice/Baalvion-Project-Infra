export type Sentiment = "positive" | "neutral" | "negative";

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: Sentiment;
  category: "AI" | "Business" | "Markets" | "World" | "Cybersecurity" | "Science";
  country: "US" | "IN" | "UK" | "DE" | "AU" | "CA";
  language: "English";
  entities: string[];
}

export const articles: Article[] = [
  {
    id: "a1",
    title: "OpenAI ships GPT Enterprise with agentic workflow tools",
    summary:
      "The release targets large enterprises with tighter data controls and native workflow automation, drawing praise from early pilot customers.",
    source: "Reuters",
    publishedAt: "2026-07-10T08:12:00Z",
    sentiment: "positive",
    category: "AI",
    country: "US",
    language: "English",
    entities: ["OpenAI"],
  },
  {
    id: "a2",
    title: "Tesla robotaxi rollout expands to three new metro areas",
    summary:
      "Following strong delivery numbers, Tesla widened its robotaxi service footprint, though regulators flagged additional review requirements.",
    source: "Bloomberg",
    publishedAt: "2026-07-10T06:40:00Z",
    sentiment: "positive",
    category: "Business",
    country: "US",
    language: "English",
    entities: ["Tesla"],
  },
  {
    id: "a3",
    title: "Nvidia Blackwell supply constraints ease into Q3",
    summary:
      "Nvidia signaled improving chip availability, easing pressure on data-center customers who had faced multi-quarter waitlists.",
    source: "CNBC",
    publishedAt: "2026-07-09T22:05:00Z",
    sentiment: "positive",
    category: "Markets",
    country: "US",
    language: "English",
    entities: ["Nvidia"],
  },
  {
    id: "a4",
    title: "India proposes stricter data-localization rules for AI models",
    summary:
      "A draft policy would require foreign AI providers to store training and inference data on domestic servers, alarming global vendors.",
    source: "Economic Times",
    publishedAt: "2026-07-09T14:22:00Z",
    sentiment: "negative",
    category: "World",
    country: "IN",
    language: "English",
    entities: ["India AI Policy"],
  },
  {
    id: "a5",
    title: "Federal Reserve holds rates, signals data-dependent path",
    summary:
      "The Fed left its benchmark rate unchanged, reiterating that future moves hinge on incoming inflation and labor data.",
    source: "Wall Street Journal",
    publishedAt: "2026-07-09T18:00:00Z",
    sentiment: "neutral",
    category: "Markets",
    country: "US",
    language: "English",
    entities: ["Federal Reserve"],
  },
  {
    id: "a6",
    title: "Ransomware group breaches UK logistics provider",
    summary:
      "A mid-size logistics firm confirmed a ransomware breach affecting shipment tracking systems across several distribution hubs.",
    source: "BBC",
    publishedAt: "2026-07-09T11:15:00Z",
    sentiment: "negative",
    category: "Cybersecurity",
    country: "UK",
    language: "English",
    entities: ["Cybersecurity"],
  },
  {
    id: "a7",
    title: "Nvidia sentiment cools on export-control uncertainty",
    summary:
      "Analysts trimmed near-term estimates after new export restrictions raised questions about China-bound shipments.",
    source: "Financial Times",
    publishedAt: "2026-07-08T20:31:00Z",
    sentiment: "negative",
    category: "Markets",
    country: "US",
    language: "English",
    entities: ["Nvidia"],
  },
  {
    id: "a8",
    title: "OpenAI opens Toronto research hub focused on safety",
    summary:
      "The new office will focus on alignment research and hire regionally, deepening OpenAI's international research footprint.",
    source: "Globe and Mail",
    publishedAt: "2026-07-08T15:47:00Z",
    sentiment: "positive",
    category: "AI",
    country: "CA",
    language: "English",
    entities: ["OpenAI"],
  },
  {
    id: "a9",
    title: "Tesla China deliveries dip amid local EV competition",
    summary:
      "Monthly delivery figures softened as domestic rivals undercut pricing, though Tesla maintained its premium segment lead.",
    source: "South China Morning Post",
    publishedAt: "2026-07-08T09:12:00Z",
    sentiment: "negative",
    category: "Business",
    country: "US",
    language: "English",
    entities: ["Tesla"],
  },
  {
    id: "a10",
    title: "Germany unveils AI research funding package worth €2B",
    summary:
      "The federal government committed fresh funding to applied-AI institutes, aiming to close the gap with US and Chinese labs.",
    source: "Handelsblatt",
    publishedAt: "2026-07-07T13:05:00Z",
    sentiment: "positive",
    category: "AI",
    country: "DE",
    language: "English",
    entities: ["AI Policy"],
  },
  {
    id: "a11",
    title: "Australia advances critical-minerals export review",
    summary:
      "New export screening rules for battery-metal shipments could reshape supply chains for EV and battery manufacturers.",
    source: "Australian Financial Review",
    publishedAt: "2026-07-07T05:50:00Z",
    sentiment: "neutral",
    category: "World",
    country: "AU",
    language: "English",
    entities: ["Critical Minerals"],
  },
  {
    id: "a12",
    title: "Quantum-error-correction milestone reported by research consortium",
    summary:
      "Researchers reported a durable logical qubit result, a step that could accelerate near-term fault-tolerant quantum computing.",
    source: "Nature News",
    publishedAt: "2026-07-06T17:40:00Z",
    sentiment: "positive",
    category: "Science",
    country: "US",
    language: "English",
    entities: ["Quantum Computing"],
  },
];

export interface EntitySnapshot {
  name: string;
  mentions: number;
  mentionsChangePct: number;
  sentimentPositivePct: number;
  topTopics: string[];
  summary: string;
  relatedEntities: string[];
}

export const entitySnapshots: Record<string, EntitySnapshot> = {
  Tesla: {
    name: "Tesla",
    mentions: 2984,
    mentionsChangePct: 187,
    sentimentPositivePct: 72,
    topTopics: ["Robotaxi rollout", "EV sales growth", "China expansion"],
    summary:
      "Tesla dominated EV headlines today following strong delivery numbers and new robotaxi announcements, though China delivery softness tempered the mood.",
    relatedEntities: ["Elon Musk", "BYD", "Nvidia", "US EV Market"],
  },
  OpenAI: {
    name: "OpenAI",
    mentions: 3512,
    mentionsChangePct: 243,
    sentimentPositivePct: 81,
    topTopics: ["GPT Enterprise", "Toronto research hub", "Agentic workflows"],
    summary:
      "OpenAI led AI coverage after shipping GPT Enterprise and opening a new safety-focused research hub, both received positively by analysts.",
    relatedEntities: ["Microsoft", "Anthropic", "Sam Altman", "AI Regulation"],
  },
  Nvidia: {
    name: "Nvidia",
    mentions: 3106,
    mentionsChangePct: 198,
    sentimentPositivePct: 58,
    topTopics: ["Blackwell supply", "Export controls", "Data-center demand"],
    summary:
      "Nvidia coverage was mixed: easing chip supply lifted sentiment while new export-control uncertainty weighed on the outlook.",
    relatedEntities: ["TSMC", "AMD", "Data Centers", "US-China Trade"],
  },
};

export interface TrendItem {
  name: string;
  category: "topic" | "company" | "country" | "person";
  changePct: number;
}

export const trends: TrendItem[] = [
  { name: "OpenAI", category: "company", changePct: 243 },
  { name: "Nvidia", category: "company", changePct: 198 },
  { name: "Tesla", category: "company", changePct: 187 },
  { name: "India AI Policy", category: "topic", changePct: 176 },
  { name: "Quantum Computing", category: "topic", changePct: 132 },
  { name: "Ransomware", category: "topic", changePct: 121 },
  { name: "United States", category: "country", changePct: 84 },
  { name: "India", category: "country", changePct: 76 },
  { name: "Germany", category: "country", changePct: 61 },
  { name: "Sam Altman", category: "person", changePct: 152 },
  { name: "Jensen Huang", category: "person", changePct: 118 },
  { name: "Elon Musk", category: "person", changePct: 96 },
];

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: "AI" | "Business" | "News Intelligence" | "Product Updates" | "Engineering";
  date: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    title: "How we built a trend-velocity model on 15M articles a day",
    excerpt: "A look inside the scoring pipeline that turns raw mention counts into a defensible trend score.",
    category: "Engineering",
    date: "2026-07-08",
    readTime: "7 min",
  },
  {
    id: "b2",
    title: "Why raw news feeds aren't enough for AI agents",
    excerpt: "Structured entities, sentiment, and trend scores are what make news usable as agent context.",
    category: "AI",
    date: "2026-07-05",
    readTime: "5 min",
  },
  {
    id: "b3",
    title: "Alert delivery under 60 seconds: our real-time pipeline",
    excerpt: "The architecture decisions behind sub-minute alert delivery across email, webhook, Slack, and Discord.",
    category: "Product Updates",
    date: "2026-07-02",
    readTime: "6 min",
  },
  {
    id: "b4",
    title: "Tracking brand reputation across 50,000 sources",
    excerpt: "How PR and comms teams use entity-level sentiment shifts to catch reputation risk early.",
    category: "Business",
    date: "2026-06-28",
    readTime: "4 min",
  },
  {
    id: "b5",
    title: "Inside the entity graph: linking companies, people, and products",
    excerpt: "A practical overview of how we resolve and link entities across hundreds of thousands of daily mentions.",
    category: "News Intelligence",
    date: "2026-06-24",
    readTime: "8 min",
  },
  {
    id: "b6",
    title: "Rate limits, quotas, and fair use on the News API",
    excerpt: "What changed in our v2 quota model and how to design around it for high-throughput agents.",
    category: "Product Updates",
    date: "2026-06-20",
    readTime: "3 min",
  },
];

export interface AlertRule {
  id: string;
  label: string;
  condition: string;
  delivery: "Email" | "Webhook" | "Slack" | "Discord";
  active: boolean;
}

export const seedAlerts: AlertRule[] = [
  { id: "al1", label: "OpenAI mentioned", condition: "Company: OpenAI", delivery: "Slack", active: true },
  { id: "al2", label: "Tesla sentiment turns negative", condition: "Sentiment Change: Tesla", delivery: "Email", active: true },
  { id: "al3", label: "AI funding news appears", condition: "Topic: AI Funding", delivery: "Webhook", active: false },
  { id: "al4", label: "Nvidia mentioned in India", condition: "Company: Nvidia + Country: India", delivery: "Discord", active: true },
];

export interface UsageSummary {
  requestsUsed: number;
  requestsLimit: number;
  planName: string;
  renewsOn: string;
  dailySeries: Array<{ day: string; requests: number }>;
}

export const usageSummary: UsageSummary = {
  requestsUsed: 68420,
  requestsLimit: 100000,
  planName: "Growth",
  renewsOn: "2026-08-01",
  dailySeries: [
    { day: "Mon", requests: 8210 },
    { day: "Tue", requests: 9430 },
    { day: "Wed", requests: 7890 },
    { day: "Thu", requests: 10420 },
    { day: "Fri", requests: 11360 },
    { day: "Sat", requests: 6540 },
    { day: "Sun", requests: 7020 },
  ],
};

export interface AlertActivityEntry {
  id: string;
  message: string;
  time: string;
}

export const alertActivity: AlertActivityEntry[] = [
  { id: "ac1", message: "OpenAI mentioned — GPT Enterprise launch (Reuters)", time: "12 min ago" },
  { id: "ac2", message: "Nvidia mentioned in India — Blackwell supply chain", time: "48 min ago" },
  { id: "ac3", message: "Tesla sentiment shifted negative — China deliveries", time: "2 hr ago" },
  { id: "ac4", message: "OpenAI mentioned — Toronto research hub", time: "5 hr ago" },
];

export const recentSearches: string[] = ["Tesla", "OpenAI", "Nvidia", "Federal Reserve", "India AI Policy"];

export interface AccountStatus {
  plan: string;
  status: "Active" | "Past due" | "Trialing";
  seats: number;
  apiKeysActive: number;
}

export const accountStatus: AccountStatus = {
  plan: "Growth",
  status: "Active",
  seats: 4,
  apiKeysActive: 2,
};
