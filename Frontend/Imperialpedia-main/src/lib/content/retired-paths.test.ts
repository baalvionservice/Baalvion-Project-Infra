import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RETIRED_TOP_LEVEL_SLUGS, canonicalizeInternalHref, isRetiredPath } from "./retired-paths";

/**
 * The redirect table and this module have to agree or the filtering built on it
 * silently stops covering a slug — which is how retired categories kept leaking
 * back into the nav and the sitemap after each retirement pass.
 */
describe("RETIRED_TOP_LEVEL_SLUGS", () => {
  it("matches the permanent redirects in next.config.ts", () => {
    const config = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
    const block = config.slice(
      config.indexOf("── TEMPORARY: categories retired pending AdSense review"),
      config.indexOf("── end temporary retirement block ──"),
    );
    expect(block).not.toBe("");
    const inConfig = new Set(
      [...block.matchAll(/source: '\/([a-z-]+)', destination: '\/', permanent: true/g)].map(
        (m) => m[1],
      ),
    );
    expect([...inConfig].sort()).toEqual([...RETIRED_TOP_LEVEL_SLUGS].sort());
  });
});

describe("isRetiredPath", () => {
  it("matches a retired hub and everything under it", () => {
    expect(isRetiredPath("/investing")).toBe(true);
    expect(isRetiredPath("/personal-finance/understanding-the-stock-market")).toBe(true);
    expect(isRetiredPath("/bonds/")).toBe(true);
    expect(isRetiredPath("/economy?ref=nav")).toBe(true);
  });

  it("leaves live paths alone", () => {
    expect(isRetiredPath("/")).toBe(false);
    expect(isRetiredPath("/stocks")).toBe(false);
    expect(isRetiredPath("/budgeting-basics/what-is-a-budget")).toBe(false);
    expect(isRetiredPath("/financial-tools/compound-interest")).toBe(false);
  });

  it("catches individually retired paths, not just whole hubs", () => {
    expect(isRetiredPath("/financial-tools/portfolio")).toBe(true);
    expect(isRetiredPath("/financial-tools/retirement")).toBe(true);
    expect(isRetiredPath("/premium")).toBe(true);
  });

  it("ignores external URLs", () => {
    expect(isRetiredPath("https://example.com/investing")).toBe(false);
  });
});

describe("sanitizeRichHtml", () => {
  it("unwraps a link into a retired hub but keeps the wording", async () => {
    const { sanitizeRichHtml } = await import("@/lib/sanitize");
    const out = sanitizeRichHtml('<p>See our <a href="/personal-finance">Personal Finance</a> hub.</p>');
    expect(out).toBe("<p>See our <span>Personal Finance</span> hub.</p>");
  });

  it("leaves live links alone", async () => {
    const { sanitizeRichHtml } = await import("@/lib/sanitize");
    const out = sanitizeRichHtml('<p><a href="/stocks/what-is-a-stock">What is a stock</a></p>');
    expect(out).toContain('href="/stocks/what-is-a-stock"');
  });
});

describe("canonicalizeInternalHref", () => {
  it("points a redirecting internal link at its destination", () => {
    expect(canonicalizeInternalHref("/articles/emergency-fund-guide")).toBe(
      "/financial-intelligence/emergency-fund-guide",
    );
    expect(canonicalizeInternalHref("/budgeting")).toBe("/budgeting-basics");
    expect(canonicalizeInternalHref("/markets/quote/AAPL")).toBe("/market-news/quote/AAPL");
  });

  it("leaves canonical and external links alone", () => {
    expect(canonicalizeInternalHref("/stocks/what-is-a-stock")).toBe("/stocks/what-is-a-stock");
    expect(canonicalizeInternalHref("https://example.com/articles/x")).toBe("https://example.com/articles/x");
  });
});

describe("sanitizeRichHtml link hygiene", () => {
  it("unwraps a link to an article deleted in the SEO cleanup, even via its alias", async () => {
    const { sanitizeRichHtml } = await import("@/lib/sanitize");
    const out = sanitizeRichHtml('<p><a href="/articles/emergency-fund-guide">Emergency funds</a></p>');
    expect(out).toBe("<p><span>Emergency funds</span></p>");
  });

  it("rewrites a redirecting alias to a live article", async () => {
    const { sanitizeRichHtml } = await import("@/lib/sanitize");
    const out = sanitizeRichHtml('<p><a href="/budgeting">Budgeting</a></p>');
    expect(out).toContain('href="/budgeting-basics"');
  });
});
