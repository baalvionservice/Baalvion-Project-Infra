#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = process.env.BAALVION_API_BASE_URL ?? "https://news.baalvion.com";
const API_KEY = process.env.BAALVION_API_KEY;

if (!API_KEY) {
  console.error(
    "[baalvion-news-mcp] Missing BAALVION_API_KEY. Get a free key at https://signal.baalvion.com/signup " +
      "and set it in your MCP client config (see README.md)."
  );
  process.exit(1);
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

async function callApi(path: string, params: Record<string, string | number | undefined>): Promise<unknown> {
  const url = new URL(path, API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const body = (await response.json()) as ApiEnvelope<unknown>;
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request to ${path} failed (HTTP ${response.status})`);
  }
  return body.data;
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "baalvion-news-mcp", version: "1.0.0" });

const CATEGORIES = ["AI", "Technology", "Business", "Finance", "Startups", "Cybersecurity", "World", "Science"] as const;
const SENTIMENTS = ["positive", "neutral", "negative"] as const;

server.tool(
  "search_news",
  "Search real-time global news articles by keyword, country, category, sentiment, source, or date range. " +
    "Use this to answer questions about what's currently being reported on a company, person, or topic.",
  {
    keyword: z.string().min(1).max(200).optional().describe("Free-text keyword, e.g. a company or person name"),
    country: z.string().length(2).optional().describe("ISO 3166-1 alpha-2 country code, e.g. US"),
    category: z.enum(CATEGORIES).optional(),
    sentiment: z.enum(SENTIMENTS).optional(),
    source: z.string().max(200).optional().describe("Filter by publisher name"),
    from: z.string().optional().describe("ISO 8601 date — only articles published on or after this date"),
    to: z.string().optional().describe("ISO 8601 date — only articles published on or before this date"),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async (input) => textResult(await callApi("/v1/news", { ...input }))
);

server.tool(
  "get_trending",
  "Get the fastest-moving news categories, countries, or sources over a recent time window, ranked by " +
    "percentage change in article volume versus the prior window of equal length.",
  {
    dimension: z.enum(["category", "country", "source"]).default("category"),
    windowHours: z.number().int().min(1).max(168).default(24).describe("Lookback window in hours (max 168 = 7 days)"),
  },
  async (input) => textResult(await callApi("/v1/news/trending", { ...input }))
);

server.tool(
  "get_article",
  "Fetch a single article's full detail by its Baalvion Intelligence article ID (as returned by search_news).",
  { id: z.string().min(1).describe("Article ID") },
  async ({ id }) => textResult(await callApi(`/v1/news/${encodeURIComponent(id)}`, {}))
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[baalvion-news-mcp] connected — API base ${API_BASE_URL}`);
}

main().catch((err: unknown) => {
  console.error("[baalvion-news-mcp] fatal error:", err);
  process.exit(1);
});
