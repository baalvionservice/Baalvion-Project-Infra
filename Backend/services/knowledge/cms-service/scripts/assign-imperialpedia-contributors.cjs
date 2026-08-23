'use strict';
/*
 * Replaces the 3-person round-robin byline (rotate-imperialpedia-author-articles.cjs)
 * with real topic-matched author/reviewer/fact-checker assignment across the full
 * live editorial roster (34 authors on file, not 3) — matching each article's real
 * category against each author's real, on-file `expertise` array.
 *
 * Sets customFields.authorSlug/author (unchanged shape from the old rotate script),
 * plus the previously-unused customFields.reviewerSlug/reviewedAt/factCheckerSlug/
 * factCheckedAt — these already exist as recognized fields (see cms-public.ts's
 * cmsContentToArticle on the frontend) but have never been populated for any
 * Imperialpedia article until now.
 *
 * Deterministic: same input (articles + authors) always produces the same
 * assignment, so re-runs are idempotent rather than reshuffling on every run.
 * Only real, on-file authors are used — nothing invented.
 *
 * USAGE
 *   node scripts/assign-imperialpedia-contributors.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/assign-imperialpedia-contributors.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public/imperialpedia';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

async function adminApi(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
  }
  return json;
}

async function publicApi(urlPath) {
  const res = await fetch(`${PUBLIC_BASE}${urlPath}`);
  return res.json();
}

async function allPublished() {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await adminApi('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&contentType=article&page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return items;
}

async function allAuthors() {
  const d = await publicApi('/authors');
  return d.data ?? d;
}

// The admin content-list endpoint returns categoryId (a raw UUID) + categoryIds,
// NOT the nested `category: { slug }` object the PUBLIC delivery API returns —
// confirmed by inspecting a live admin response directly. Build slug -> real
// categorySlug from the public API (which does carry category.slug per article)
// and key admin articles off their `slug`, which both APIs share.
async function slugToCategorySlugMap() {
  const map = new Map();
  for (let page = 1; page <= 10; page++) {
    const d = await publicApi(`/content?contentType=article&limit=100&page=${page}`);
    const items = d.data ?? [];
    for (const item of items) {
      if (item.slug) map.set(item.slug, item.category?.slug);
    }
    if (items.length < 100) break;
  }
  return map;
}

// Manually curated: category slug -> keywords to match against author.expertise.
// Built from the real 56 category slugs in use and the real expertise vocabulary
// on file for the 34 live authors. See ../../../../Frontend/Imperialpedia-main
// content-service.ts getRelatedArticles for the same real-topic-matching approach
// applied to the Related Articles box.
const CATEGORY_KEYWORDS = {
  stocks: ['Stock', 'Trading', 'Technical Analysis', 'Equity', 'Market Analysis'],
  'personal-finance': ['Personal Finance'],
  fed: ['Federal', 'Economics', 'Monetary Policy'],
  debt: ['Debt'],
  earnings: ['Financial Analysis', 'Investment Analysis', 'Stock', 'Fundamental Analysis'],
  crypto: ['Cryptocurrency', 'Blockchain', 'Digital Assets', 'Bitcoin'],
  cryptocurrency: ['Cryptocurrency', 'Blockchain', 'Digital Assets', 'Bitcoin'],
  credit: ['Credit'],
  economy: ['Economics'],
  portfolio: ['Portfolio Management', 'Portfolio Construction'],
  gdp: ['Economics'],
  'tax-software': ['Tax Planning', 'Personal Taxes', 'Taxes'],
  'app-reviews': ['FinTech', 'Personal Finance'],
  'loan-reviews': ['Loans', 'Loan Review'],
  global: ['Global Markets', 'International'],
  'financial-calculators': ['Financial Planning'],
  'money-management': ['Personal Finance', 'Financial Planning'],
  'financial-independence': ['Personal Finance', 'Retirement Planning'],
  planning: ['Financial Planning'],
  'banking-reviews': ['Banking'],
  'money-market': ['Money Market', 'Banking'],
  'cd-rates': ['Banking', 'CDs', 'Savings'],
  checking: ['Banking', 'Deposit Products'],
  'live-market-news': ['Financial Markets', 'Markets'],
  brokers: ['Investing', 'Trading', 'Online Brokers'],
  'student-loans': ['Student Loans'],
  'auto-loans': ['Loans'],
  'fiscal-policy': ['Public Policy', 'Economics'],
  inflation: ['Economics'],
  indicators: ['Economics', 'Financial Markets'],
  mortgages: ['Mortgages', 'Real Estate'],
  loans: ['Loans'],
  'credit-cards': ['Credit', 'Personal Finance'],
  retirement: ['Retirement Planning', 'Retirement Income'],
  'real-estate': ['Real Estate'],
  options: ['Options'],
  'mutual-funds': ['Investing', 'Asset Management'],
  etfs: ['ETFs'],
  bonds: ['Fixed Income'],
  calendar: ['Financial Markets'],
  'advanced-budgeting': ['Financial Planning', 'Personal Finance'],
  'saving-money': ['Personal Finance', 'Savings Accounts'],
  'budget-rules': ['Personal Finance'],
  unemployment: ['Economics'],
  savings: ['Personal Finance', 'Savings Accounts'],
  commodities: ['Commodities'],
  'family-budget': ['Personal Finance'],
  'monthly-budget': ['Personal Finance'],
  'budgeting-basics': ['Personal Finance', 'Financial Education'],
  'monetary-policy': ['Economics', 'Monetary Policy'],
  'interest-rates': ['Economics', 'Fixed Income'],
  'budgeting-apps': ['FinTech', 'Personal Finance'],
  'emergency-fund': ['Personal Finance'],
  'student-budget': ['Personal Finance'],
  investing: ['Investing'],
  banking: ['Banking'],
};

const FACT_CHECKER_SLUGS = new Set([
  'linda-zhao', 'vikki-velasquez', 'hans-daniel-jasperson', 'betsy-petrick', 'jiwon-ma', 'yarilet-perez',
]);

function expertiseScore(author, keywords) {
  const exp = (author.expertise || []).join(' | ').toLowerCase();
  const title = (author.title || '').toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (exp.includes(k)) score += 2;
    if (title.includes(k)) score += 1;
  }
  return score;
}

function pickAssignment(article, authors, categorySlug) {
  const keywords = CATEGORY_KEYWORDS[categorySlug] || [];

  const scored = authors
    .map((a) => ({ author: a, score: expertiseScore(a, keywords) }))
    .sort((x, y) => y.score - x.score);

  const nonFactCheckers = scored.filter((s) => !FACT_CHECKER_SLUGS.has(s.author.slug));
  const factCheckerCandidates = scored.filter((s) => FACT_CHECKER_SLUGS.has(s.author.slug));

  const authorPick = (nonFactCheckers[0]?.score > 0 ? nonFactCheckers[0] : scored[0])?.author;
  const reviewerPick = (nonFactCheckers.find((s) => s.author.slug !== authorPick?.slug && s.score > 0) || nonFactCheckers[1])?.author;
  const factCheckerPick = (factCheckerCandidates.find((s) => s.score > 0) || factCheckerCandidates[0])?.author;

  return { authorPick, reviewerPick, factCheckerPick };
}

async function main() {
  console.log('Imperialpedia contributor assignment (author + reviewer + fact-checker)');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to update.');

  const [authors, articles, categoryMap] = await Promise.all([allAuthors(), allPublished(), slugToCategorySlugMap()]);
  console.log(`  authors: ${authors.length}`);
  console.log(`  found  : ${articles.length} published article(s)`);
  console.log(`  cat map: ${categoryMap.size} slug->category entries\n`);

  const today = new Date().toISOString();
  let changed = 0;

  for (const article of articles) {
    const categorySlug = categoryMap.get(article.slug);
    const { authorPick, reviewerPick, factCheckerPick } = pickAssignment(article, authors, categorySlug);
    if (!authorPick) {
      console.log(`  ! no match for ${article.slug} (category: ${categorySlug || 'none'}) — skipped`);
      continue;
    }

    const cf = article.customFields || {};
    const already =
      cf.authorSlug === authorPick.slug &&
      cf.reviewerSlug === reviewerPick?.slug &&
      cf.factCheckerSlug === factCheckerPick?.slug;

    if (already) {
      console.log(`  = already correct  ${article.slug}`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ~ ${article.slug}  [${categorySlug}]`);
      console.log(`      By ${authorPick.name} | Reviewed by ${reviewerPick?.name || '—'} | Fact checked by ${factCheckerPick?.name || '—'}`);
      changed++;
      continue;
    }

    const nextCustomFields = {
      ...cf,
      author: { name: authorPick.name, title: authorPick.title },
      authorSlug: authorPick.slug,
      ...(reviewerPick ? { reviewerSlug: reviewerPick.slug, reviewedAt: today } : {}),
      ...(factCheckerPick ? { factCheckerSlug: factCheckerPick.slug, factCheckedAt: today } : {}),
    };
    await adminApi('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, {
      customFields: nextCustomFields,
    });
    console.log(`  ✓ ${article.slug}  →  By ${authorPick.name} | Reviewed by ${reviewerPick?.name || '—'} | Fact checked by ${factCheckerPick?.name || '—'}`);
    changed++;
  }

  console.log(
    DRY_RUN
      ? `\n(dry run — ${changed} would change, nothing was updated)`
      : `\n✓ complete. ${changed} article(s) updated.`
  );
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
