'use strict';
/*
 * Second-pass rewrites that replace the ~250-word `blk-rewrite-0` bodies published by
 * publish-imperialpedia-content-rewrites.cjs with full-depth articles.
 *
 * That first pass collapsed every article to a single short summary block — 411 of its
 * 477 entries came out under 300 words, and 270 shipped a truncated "<h2>Use X the Way</h2>"
 * heading. Google AdSense rejected the property for low-value content. This script fixes
 * bodies one verified batch at a time, and unlike the first pass it also writes
 * keyTakeaways, faq, citations, wordCount and readingTimeMinutes, so the stored metadata
 * matches what actually renders.
 *
 * Every figure in a body below is verified against the primary source recorded in that
 * entry's `citations`; `researchNote` records how.
 *
 * USAGE
 *   node scripts/publish-imperialpedia-depth-rewrites.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/publish-imperialpedia-depth-rewrites.cjs
 *   CMS_TOKEN=<bearer> node scripts/publish-imperialpedia-depth-rewrites.cjs --only=dividend-yield-explained
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const ONLY = (ARGS.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');
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

async function findBySlug(slug) {
  for (let page = 1; page <= 50; page++) {
    const res = await adminApi('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&contentType=article&page=${page}&limit=100`);
    const items = res?.data ?? [];
    const hit = items.find((a) => a.slug === slug);
    if (hit) return hit;
    if (!res?.pagination?.hasNext || items.length === 0) break;
  }
  return null;
}

const STOCKS_A = require('./imperialpedia-depth-stocks-a.data.cjs');
const STOCKS_B = require('./imperialpedia-depth-stocks-b.data.cjs');
const STOCKS_C = require('./imperialpedia-depth-stocks-c.data.cjs');

const REWRITES = [
  ...STOCKS_A,
  ...STOCKS_B,
  ...STOCKS_C,
  {
    slug: 'dividend-yield-explained',
    // "Dividend Yield Explained" is one of 44 titles in this corpus ending in the same
    // word. Naming what the article actually delivers reads better and matches how the
    // query is searched.
    title: 'Dividend Yield: Formula, Examples, and What a High Yield Really Signals',
    seoTitle: 'Dividend Yield: Formula, Examples, and What a High Yield Signals',
    seoDescription:
      'How to calculate dividend yield, why it rises when a stock falls, and how to tell a sustainable payout from a yield trap — with the Walgreens cut and suspension as a worked case.',
    researchNote:
      'S&P 500 yield of 1.05% (Sep 2, 2026) and the long-run mean 4.21% / median 4.19% / June 1932 peak of 13.84% read directly off multpl\'s S&P 500 dividend yield series. The Walgreens sequence is sourced to CNBC\'s Jan 4 2024 earnings report (48c to 25c, 47 straight years of increases, Dividend Aristocrat removal) and to WBA\'s own SEC Form 8-K exhibit dated Jan 30 2025 for the suspension. Dividend Aristocrats entry rules (S&P 500 membership, 25 consecutive years, $3B float-adjusted cap, $5M average daily value traded) from S&P Dow Jones Indices\' Dividend Aristocrats methodology. Tax mechanics from IRS Topic 404 (1099-DIV at $10, Schedule B over $1,500) and Publication 550 (>60 days within the 121-day window; >90 within 181 days for preferred). Rate thresholds are quoted as the 2025 figures IRS Topic 409 currently publishes, and labeled as such rather than projected forward.',
    citations: [
      { title: 'S&P 500 Dividend Yield — current value and historical series (multpl)', url: 'https://www.multpl.com/s-p-500-dividend-yield' },
      { title: 'Walgreens cuts quarterly dividend nearly in half — CNBC, January 4, 2024', url: 'https://www.cnbc.com/2024/01/04/walgreens-wba-earnings-q1-2024.html' },
      { title: 'Walgreens Boots Alliance Form 8-K Exhibit 99.1 — dividend suspension, January 30, 2025 (SEC EDGAR)', url: 'https://www.sec.gov/Archives/edgar/data/1618921/000119312525017343/d910027dex991.htm' },
      { title: 'S&P Dividend Aristocrats Indices Methodology — S&P Dow Jones Indices', url: 'https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-dividend-aristocrats-indices.pdf' },
      { title: 'Topic no. 404, Dividends — Internal Revenue Service', url: 'https://www.irs.gov/taxtopics/tc404' },
      { title: 'Publication 550, Investment Income and Expenses — Internal Revenue Service', url: 'https://www.irs.gov/publications/p550' },
      { title: 'Topic no. 409, Capital gains and losses — Internal Revenue Service', url: 'https://www.irs.gov/taxtopics/tc409' },
    ],
    keyTakeaways: [
      'Dividend yield is annual dividend per share divided by current share price — a ratio with price in the denominator, which is why it moves even when the dividend never changes.',
      'A yield can rise for the wrong reason. If the share price falls and the payout stays flat, the yield goes up while the company gets weaker, not stronger.',
      'Walgreens yielded over 7% — the highest in the Dow — before cutting its dividend 48% in January 2024 and suspending it entirely in January 2025.',
      'The payout ratio and free cash flow coverage tell you whether a dividend is affordable; the yield on its own tells you nothing about sustainability.',
      'Yields are only comparable within a sector. Utilities and REITs structurally yield more than software companies, which is a fact about their business models, not their generosity.',
      'The S&P 500 yielded 1.05% in September 2026 against a long-run mean of 4.21%, largely because buybacks have displaced dividends as the default way to return cash.',
      'Qualified dividends are taxed at 0%, 15%, or 20% only if you held the stock more than 60 days within the 121-day window around the ex-dividend date.',
    ],
    faq: [
      {
        question: 'What is a good dividend yield?',
        answer:
          'There is no single number, because the honest benchmark is the sector, not the market. A 4% yield is unremarkable for a utility or a REIT and would be extraordinary for a software company. As a rough orientation, a yield roughly in line with sector peers and backed by a payout ratio under about 60% is the unglamorous profile most income investors are actually looking for. A yield far above its peer group is a question to investigate, not a bargain to act on.',
      },
      {
        question: 'Why did a stock\'s dividend yield go up when the company never raised its dividend?',
        answer:
          'Because price sits in the denominator. If a company keeps paying $2.00 a share and the stock falls from $50 to $25, the yield doubles from 4% to 8% without a single cent being added to the payout. This is the most common reason a yield rises, and it means the screen you sorted by "highest yield" is frequently sorting for the worst-performing stocks in the market.',
      },
      {
        question: 'What is a dividend yield trap?',
        answer:
          'A yield trap is a stock whose yield looks generous only because the market has marked the shares down in anticipation of a dividend cut. The investor buys for the income, the cut arrives, and they are left holding both a reduced payout and a capital loss. Walgreens is the textbook case: it yielded more than 7% going into 2024, cut the dividend 48% that January, and suspended it altogether a year later.',
      },
      {
        question: 'What payout ratio is considered safe?',
        answer:
          'Below roughly 60% of earnings gives a company room to keep paying through a weak year, and many mature businesses sit between 30% and 50%. Above 80% the margin for error is thin, and above 100% the company is paying out more than it earns and funding the difference from cash reserves, asset sales, or borrowing. Those thresholds shift by industry — REITs are legally required to distribute at least 90% of taxable income, so a high ratio there is structural rather than a warning.',
      },
      {
        question: 'Is dividend yield the same as total return?',
        answer:
          'No, and confusing the two is a costly mistake. Total return combines dividends with the change in share price. A stock yielding 6% that falls 15% delivered a negative total return of about -9% for the year, while a stock yielding nothing that appreciated 20% returned 20%. Yield describes one component of return, not the result.',
      },
      {
        question: 'Are dividends taxed differently from a stock sale?',
        answer:
          'Qualified dividends are taxed at the same preferential 0%, 15%, or 20% rates that apply to long-term capital gains, but only if you satisfy the IRS holding-period rule: more than 60 days during the 121-day period beginning 60 days before the ex-dividend date. Fail that test and the dividend is taxed as ordinary income at your marginal rate. Dividends are also taxable in the year they are paid even if you reinvest them automatically, which is why holding high-yield positions in a taxable account can produce a bill on income you never actually received in cash.',
      },
    ],
    body: `<p>Dividend yield is the share of a stock's current price that the company returns to shareholders in cash over a year, expressed as a percentage. The arithmetic is trivial: annual dividend per share divided by share price. The interpretation is where investors lose money, because the ratio has the share price in its denominator — which means a stock's yield rises when the market decides the company is in trouble.</p>
<p>That single mechanical fact explains why a "highest yield" screen so reliably surfaces struggling companies, and why the most quoted yield in any given year often belongs to a business about to cut its payout. This article covers how to calculate the ratio, what the current market context is, how to test whether a dividend is actually affordable, and the specific case of a Dow component that yielded over 7% shortly before paying nothing at all.</p>
<h2>A Ratio With Price in the Denominator</h2>
<p>The formula is:</p>
<p><strong>Dividend yield = annual dividend per share ÷ current share price × 100</strong></p>
<p>A company paying $0.50 quarterly pays $2.00 a year. At a $50 share price that is a 4.0% yield. The number is quoted on every brokerage and finance site, and almost always as a <em>trailing</em> figure: the dividends actually paid over the previous twelve months. Some sites instead publish a <em>forward</em> yield, which annualizes the most recent quarterly payment. The two diverge sharply around any dividend change, which is precisely when investors are paying closest attention, so it is worth knowing which one you are reading.</p>
<p>Because the denominator updates every time the stock trades, the yield changes continuously while the numerator changes at most a few times a year. A dividend yield is therefore a statement about price at least as much as it is a statement about the dividend.</p>
<h2>Calculating It: The Same Dividend, Three Prices</h2>
<p>Hold the payout constant at $2.00 a share and vary only the price:</p>
<div class="table-scroll"><table><thead><tr><th>Share price</th><th>Annual dividend</th><th>Dividend yield</th><th>What changed</th></tr></thead><tbody><tr><td>$50.00</td><td>$2.00</td><td>4.0%</td><td>Baseline</td></tr><tr><td>$40.00</td><td>$2.00</td><td>5.0%</td><td>Stock fell 20%; yield rose</td></tr><tr><td>$25.00</td><td>$2.00</td><td>8.0%</td><td>Stock halved; yield doubled</td></tr></tbody></table></div>
<p>Nothing improved between the first row and the last. The company did not become more generous; its shares became less valuable, and the yield rose as a direct consequence. An investor who bought at $25 for the 8% yield has taken on whatever the market was pricing in when it cut the shares in half, and the dividend is the first thing management can reduce if that judgment proves right.</p>
<div class="callout callout-tip"><p>Before treating any yield as income, check when the payout was last <em>increased</em>. A dividend frozen at the same level for several years while the share price slides is a company signalling reluctance to commit further cash, and often the quiet stage that precedes a cut.</p></div>
<h2>What Counts as a High Yield Right Now</h2>
<p>Context has shifted enormously. As of September 2, 2026, the S&P 500's dividend yield stood at <a href="https://www.multpl.com/s-p-500-dividend-yield" target="_blank" rel="noopener noreferrer nofollow">1.05%</a>, against a long-run mean of 4.21% and a median of 4.19% for the series, which runs back to 1871 (multpl, 2026). The historical high was 13.84% in June 1932, in the depths of the Depression, when prices had collapsed rather than dividends surged. It is the same denominator effect, at national scale.</p>
<p>Two things drive today's low reading. Valuations are elevated, which mechanically suppresses yield. And share buybacks have substantially displaced dividends as the preferred method of returning capital, because repurchases are discretionary in a way a dividend is not: cutting a buyback is a non-event, while cutting a dividend is a public admission. A modern company returning a great deal of cash to shareholders may still show a modest yield.</p>
<p>The practical consequence is that "above average" now means something very different than it did a generation ago, and a 5% yield in a market averaging 1.05% is a substantial outlier that deserves explanation before it deserves capital.</p>
<h2>The Yield Trap: What Walgreens' 7% Payout Was Actually Telling Investors</h2>
<p>Walgreens Boots Alliance is the clearest recent illustration of a yield that looked like income and functioned as a warning.</p>
<p>Going into 2024, Walgreens carried a dividend yield above 7%, the highest of any component of the Dow Jones Industrial Average. It had raised its dividend every year for 47 consecutive years, a streak long enough to earn membership in the S&P 500 Dividend Aristocrats and to put it within striking distance of the 50-year Dividend King threshold. On paper this was the profile income investors screen for: a blue-chip name, a decades-long record, and an unusually large payout.</p>
<h3>The cut nobody screened for</h3>
<p>On January 4, 2024, Walgreens cut the quarterly dividend from 48 cents to 25 cents — a reduction of roughly <a href="https://www.cnbc.com/2024/01/04/walgreens-wba-earnings-q1-2024.html" target="_blank" rel="noopener noreferrer nofollow">48%</a> — to strengthen its balance sheet and cash position (CNBC, 2024). The 47-year streak ended, and the company was removed from the Dividend Aristocrats index.</p>
<h3>Then the yield went back up</h3>
<p>What happened next is the part investors most often miss. The shares kept falling faster than the reduced dividend, so the yield went back <em>up</em>, into the 9–10% range through late 2024. A screen sorted by yield would have flagged Walgreens as an even more attractive income stock after the cut than before it. Then, on January 30, 2025, the board suspended the cash dividend outright, ending a payout streak that had run more than 90 years, citing debt reduction and free cash flow as the priorities (<a href="https://www.sec.gov/Archives/edgar/data/1618921/000119312525017343/d910027dex991.htm" target="_blank" rel="noopener noreferrer nofollow">Walgreens Form 8-K, 2025</a>).</p>
<div class="table-scroll"><table><thead><tr><th>Stage</th><th>What the yield showed</th><th>What was actually happening</th></tr></thead><tbody><tr><td>Late 2023</td><td>Over 7% — highest in the Dow</td><td>Price falling on reimbursement pressure and costs</td></tr><tr><td>January 2024</td><td>Halved by the 48% cut</td><td>47-year increase streak ends; removed from the Aristocrats</td></tr><tr><td>Late 2024</td><td>Back up to 9–10%</td><td>Price falling faster than the reduced payout</td></tr><tr><td>January 2025</td><td>Zero</td><td>Dividend suspended after 90-plus years</td></tr></tbody></table></div>
<p>The lesson is not that high yields are always traps. It is that the yield is a quotient, and a quotient cannot distinguish between a generous payer and a collapsing price. Only the underlying financials can.</p>
<h2>Testing Whether a Dividend Is Affordable</h2>
<p>Three checks separate a durable payout from one that is being defended past the point of sense.</p>
<h3>Three checks that separate a durable payout from a doomed one</h3>
<p><strong>The payout ratio.</strong> Dividends divided by <a href="/stocks/net-income-explained">net income</a> tells you what share of profit is being distributed. Under roughly 60% leaves room to keep paying through a weak year. Above 80% the margin is thin. Above 100% the company is distributing more than it earns and covering the gap from reserves, asset sales, or debt, which is possible for a while and not indefinitely.</p>
<p><strong>Free cash flow coverage.</strong> Earnings are an accounting figure and can be shaped by non-cash items. Dividends are paid in cash. Comparing the dividend to <a href="/stocks/free-cash-flow-explained">free cash flow</a> asks the more direct question: after the company funds its operations and capital spending, is there enough left to write the checks? A payout ratio that looks comfortable against earnings and uncomfortable against free cash flow is a meaningful discrepancy.</p>
<p><strong>The balance sheet and the sector.</strong> A heavily indebted company facing refinancing has a competing claim on the same cash, and lenders are ahead of shareholders in the queue. That was the precise pressure Walgreens cited. And read every ratio against the sector, not the market: REITs must distribute at least 90% of taxable income to keep their tax status, so a high payout ratio there is a legal requirement rather than a red flag.</p>
<div class="callout callout-info"><p>For a benchmark of what a well-supported record looks like, the S&P 500 Dividend Aristocrats index admits only S&P 500 members that have raised their dividend for at least 25 consecutive years, with a float-adjusted market cap of at least $3 billion and average daily trading value of at least $5 million (S&P Dow Jones Indices). Membership is not a guarantee, since Walgreens was a constituent, but the entry bar filters out most of the yields that exist only because a stock is falling.</p></div>
<h2>Yield, Yield on Cost, and Total Return Are Three Different Numbers</h2>
<p>Investors routinely conflate these, and the differences matter.</p>
<p><strong>Dividend yield</strong> is measured against today's price and is what a new buyer would receive. <strong>Yield on cost</strong> is measured against the price <em>you</em> paid. Buy at $50 with a $2.00 dividend and your yield on cost starts at 4%; if the dividend grows to $4.00 over a decade, your yield on cost is 8% while a new buyer at the then-current price might see 2.5%. Yield on cost is a useful record of a holding's history and a poor basis for a new decision, because it says nothing about what the shares are worth now.</p>
<p><strong>Total return</strong> combines dividends with price change, and it is the only one of the three that describes what actually happened to your money. A stock yielding 6% that declines 15% produced roughly a -9% total return. This is the arithmetic that made Walgreens' pre-cut yield so misleading: the income was real, and it was smaller than the capital loss accumulating alongside it.</p>
<h2>What the Ratio Cannot See</h2>
<p>The ratio has structural blind spots worth naming.</p>
<ul>
<li><strong>It ignores buybacks entirely.</strong> A company returning heavily through repurchases can show a low yield while returning more total capital than a higher-yielding peer.</li>
<li><strong>It is backward-looking.</strong> A trailing yield reports dividends already paid and carries no commitment about the next one.</li>
<li><strong>It is not comparable across sectors.</strong> Utilities, REITs, and consumer staples yield structurally more than growth-stage technology companies. That reflects capital intensity and reinvestment opportunity, not shareholder friendliness.</li>
<li><strong>A zero yield says nothing negative.</strong> Companies reinvesting everything into growth pay nothing by design, and have often been the market's strongest performers.</li>
<li><strong>It ignores tax drag.</strong> In a taxable account, dividends create a bill in the year they are paid whether or not you wanted the cash.</li>
</ul>
<h2>How Dividend Income Is Taxed</h2>
<p>The IRS separates dividends into <em>ordinary</em> and <em>qualified</em>. Ordinary dividends are taxed as ordinary income at your marginal rate. Qualified dividends are taxed at the lower long-term capital gains rates of 0%, 15%, or 20% (<a href="https://www.irs.gov/taxtopics/tc404" target="_blank" rel="noopener noreferrer nofollow">IRS Topic 404</a>).</p>
<p>Qualification depends on a holding-period test that trips up more investors than it should. Per <a href="https://www.irs.gov/publications/p550" target="_blank" rel="noopener noreferrer nofollow">IRS Publication 550</a>, you must hold common stock more than 60 days during the 121-day period beginning 60 days before the ex-dividend date. Preferred stock requires more than 90 days within a 181-day window. Buying just before an ex-dividend date to capture a payment and selling shortly after fails this test, and the dividend is taxed as ordinary income.</p>
<p>Which rate applies depends on total taxable income and filing status. The IRS currently publishes 2025 thresholds of $48,350 for single filers and $96,700 for married filing jointly at the 0% rate, with the 20% rate beginning above $533,400 and $600,050 respectively (<a href="https://www.irs.gov/taxtopics/tc409" target="_blank" rel="noopener noreferrer nofollow">IRS Topic 409</a>); these brackets are adjusted for inflation annually, so confirm the current year's figures before planning around them. Payers issue Form 1099-DIV for distributions of at least $10, and Schedule B is required once ordinary dividends exceed $1,500.</p>
<h2>The Bottom Line</h2>
<p>Dividend yield answers one narrow question — what percentage of today's price the company paid out over the last year — and investors routinely ask it to answer a much larger one about whether a stock is worth owning. It cannot. The ratio rises when a stock falls, which means the yields that stand out most in a screen are disproportionately the ones the market has already marked down for a reason.</p>
<p>Used properly, yield is a starting filter rather than a conclusion. Compare it within the sector, not against the market. Confirm the payout ratio and free cash flow can support it. Check whether the dividend is still being raised or has quietly gone flat. And judge the position on total return, because a 7% yield that arrives alongside a 48% cut and then a suspension was never income in the first place.</p>
<p>For the wider strategy this ratio feeds into, see <a href="/stocks/dividend-investing-strategy">dividend investing strategy</a> and <a href="/stocks/dividend-stocks-explained">dividend stocks explained</a>.</p>`,
  },
];

function wordCountOf(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').split(/\s+/).filter(Boolean).length;
}

const { shortfalls, corpusIssues, measure } = require('./house-style.cjs');

async function main() {
  const batch = ONLY ? REWRITES.filter((r) => r.slug === ONLY) : REWRITES;

  // Cross-article checks run over the whole set, not the filtered batch, so a single
  // --only publish still surfaces a skeleton the rest of the corpus already uses.
  const formulaic = corpusIssues(REWRITES);
  if (formulaic.length) {
    console.log('  house-style warnings across the corpus:');
    formulaic.forEach((f) => console.log(`      ${f}`));
    console.log('');
  }

  console.log('Imperialpedia depth rewrite publish');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}`);
  console.log(`  batch  : ${batch.length} article(s)\n`);

  if (!batch.length) throw new Error(ONLY ? `No rewrite entry for --only=${ONLY}` : 'Nothing to publish.');
  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to update.');

  let belowStandard = 0;

  for (const rewrite of batch) {
    const words = wordCountOf(rewrite.body);
    const readingTimeMinutes = Math.max(1, Math.round(words / 225));

    const gaps = shortfalls(rewrite);
    if (gaps.length) {
      console.log(`  ✗ ${rewrite.slug} — below the house standard, not published`);
      gaps.forEach((g) => console.log(`      ${g}`));
      belowStandard++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ~ would rewrite ${rewrite.slug}`);
      console.log(`      ${words} words · ${readingTimeMinutes} min · ${rewrite.citations.length} citations · ${rewrite.faq.length} FAQ · ${rewrite.keyTakeaways.length} takeaways`);
      if (rewrite.title) console.log(`      retitle → ${rewrite.title}`);
      continue;
    }

    const article = await findBySlug(rewrite.slug);
    if (!article) {
      console.log(`  ! not found: ${rewrite.slug} — skipped`);
      continue;
    }

    const nextCustomFields = {
      ...(article.customFields || {}),
      citations: rewrite.citations,
      faq: rewrite.faq,
      keyTakeaways: rewrite.keyTakeaways,
      wordCount: words,
      readingTimeMinutes,
    };

    // Title only — the slug is deliberately left alone so no live URL moves and no
    // redirect hop is introduced.
    const payload = {
      contentBlocks: [{ id: 'blk-depth-0', type: 'html', order: 0, content: { html: rewrite.body } }],
      customFields: nextCustomFields,
      readingTimeMinutes,
    };
    if (rewrite.title) payload.title = rewrite.title;
    if (rewrite.seoTitle || rewrite.seoDescription) {
      payload.seoMetadata = {
        ...(article.seoMetadata || {}),
        ...(rewrite.seoTitle ? { title: rewrite.seoTitle } : {}),
        ...(rewrite.seoDescription ? { description: rewrite.seoDescription } : {}),
      };
    }

    await adminApi('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, payload);
    console.log(`  ✓ rewrote ${rewrite.slug} (${words} words, ${readingTimeMinutes} min)`);
  }

  if (belowStandard) console.log(`\n  ! ${belowStandard} entr${belowStandard === 1 ? 'y' : 'ies'} skipped for falling below the house standard.`);
  console.log(DRY_RUN ? '\n(dry run — nothing was updated)' : '\n✓ complete.');
}

module.exports = { REWRITES };

// Running the file directly publishes; requiring it (see export-drafts-for-preview.cjs) does not.
if (require.main === module) main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
