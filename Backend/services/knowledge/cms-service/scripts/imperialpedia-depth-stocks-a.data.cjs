'use strict';
/*
 * Depth-rewrite batch A — the five stocks articles that read off a single company's
 * audited financials, so one primary source (Apple's Q4 FY2025 Form 8-K earnings
 * exhibit) supports the worked examples in all of them and every figure traces back
 * to a filing rather than a secondary aggregator.
 *
 * Consumed by publish-imperialpedia-depth-rewrites.cjs.
 */

// Apple Inc., twelve months ended September 27, 2025 vs. September 28, 2024, per the
// Q4 FY2025 Form 8-K financial exhibit. Every derived figure quoted in the bodies below
// is computed from these and rounded as stated.
//   net sales      416,161 / 391,035  ($M)      → +6.4%
//   net income     112,010 /  93,736  ($M)      → +19.5%
//   basic EPS         7.49 /    6.11            → +22.6%
//   diluted EPS       7.46 /    6.08
//   basic shares  14,948,500 / 15,343,783 (000) → −2.6%
//   diluted shares 15,004,697 / 15,408,095 (000)
// FY2024 GAAP results are depressed by a one-time $10.2B net income tax charge from the
// Sept 10 2024 CJEU State Aid ruling. Apple's own Q4 FY2024 8-K also presents the adjusted
// figures excluding it: net income $103,982M and diluted EPS $6.75. Any FY2025-vs-FY2024
// growth rate must say which basis it is on — GAAP net income +19.5% but adjusted +7.7%.
const APPLE_8K = {
  title: 'Apple Inc. Q4 FY2025 Form 8-K, condensed consolidated financial statements (SEC EDGAR)',
  url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm',
};
const APPLE_8K_FY24 = {
  title: 'Apple Inc. Q4 FY2024 Form 8-K, including the $10.2B State Aid tax charge and adjusted figures (SEC EDGAR)',
  url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm',
};
const SPDJI_BUYBACKS = {
  title: 'S&P 500 Q1 2025 Buybacks Set Quarterly Record at $293 Billion — S&P Dow Jones Indices',
  url: 'https://www.spglobal.com/spdji/en/corporate-news/article/sp-500-q1-2025-buybacks-set-quarterly-record-at-293-billion-up-206-helping-eps-growth',
};
const FACTSET_EI = {
  title: 'S&P 500 Earnings Season Update, July 24 2026 — FactSet Earnings Insight',
  url: 'https://insight.factset.com/sp-500-earnings-season-update-july-24-2026',
};
const ALPHABET_8K = {
  title: 'Alphabet Inc. Q2 2026 Form 8-K earnings exhibit (SEC EDGAR)',
  url: 'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm',
};
const MULTPL_CAPE = {
  title: 'Shiller PE Ratio (CAPE) — current value and historical series (multpl)',
  url: 'https://www.multpl.com/shiller-pe',
};
const MULTPL_PE = {
  title: 'S&P 500 P/E Ratio — current value and historical series (multpl)',
  url: 'https://www.multpl.com/s-p-500-pe-ratio',
};

module.exports = [
  {
    slug: 'net-income-explained',
    title: 'Net Income: What the Bottom Line Includes, and What It Hides',
    seoTitle: 'Net Income Explained: Definition, Formula, and Real Examples',
    seoDescription:
      "Where net income sits on the income statement, why Alphabet's quadrupled on a non-cash gain while its business grew 30%, and why operating income is often the more honest line.",
    researchNote:
      "Alphabet figures from its Q2 2026 Form 8-K earnings exhibit on SEC EDGAR: revenues $119.8B vs $96.4B, operating income $40.8B vs $31.3B (+30%, margin 34%), other income $98.0B vs $2.7B including a $99.0B gain on equity securities, net income $112.2B vs $28.2B, diluted EPS $9.11 vs $2.31. Derived growth rates (+24% revenue, +298% net income, +294% EPS) recomputed from those figures. Apple's one-time $10.2B net State Aid tax charge, and its adjusted FY2024 net income of $103,982M against $93,736M GAAP, from Apple's Q4 FY2024 Form 8-K; FY2025 net income of $112,010M from the Q4 FY2025 exhibit. FactSet Earnings Insight (July 24 2026) supplies the index-level context: aggregate Q2 2026 earnings 39.3% above estimates, falling to 12.6% excluding Alphabet's gain, against a 5-year average of 7.0%.",
    citations: [ALPHABET_8K, APPLE_8K_FY24, APPLE_8K, FACTSET_EI],
    keyTakeaways: [
      'Net income is what remains after every expense, interest, tax and one-time item is subtracted from revenue — the last line of the income statement.',
      'It is the most complete profit measure and the most easily distorted, because everything non-recurring lands in it.',
      "Alphabet's Q2 2026 net income rose 298% to $112.2 billion while operating income rose 30% — the difference was a $99 billion non-cash gain on equity stakes.",
      "Apple's fiscal 2024 net income was pushed the other way, down $10.2 billion by a one-time European State Aid tax charge.",
      'Operating income excludes interest, tax and investment gains, which usually makes it the better read on whether the business itself improved.',
      'Net income is an accounting figure, not cash. Free cash flow answers the separate question of what the business actually generated.',
      'Net margin — net income as a percentage of revenue — is comparable within an industry and misleading across industries.',
    ],
    faq: [
      {
        question: 'What is the difference between net income and operating income?',
        answer:
          'Operating income is profit from the core business after operating costs, but before interest, taxes and anything to do with investments. Net income continues down the statement and subtracts all of those. Because one-time gains, losses, tax settlements and investment revaluations only appear below the operating line, operating income usually gives the cleaner read on whether the business itself improved. Alphabet grew operating income 30% in Q2 2026 while net income grew 298%.',
      },
      {
        question: 'Is net income the same as cash flow?',
        answer:
          'No, and the gap matters. Net income includes non-cash items — depreciation, stock-based compensation, and unrealised gains or losses on investments that no one has sold. A company can report record net income in a period when its bank balance fell. The cash flow statement, and free cash flow specifically, answers the separate question of how much cash the business actually generated.',
      },
      {
        question: 'Why did a company report enormous profit growth without growing much?',
        answer:
          'Almost always because something below the operating line moved. Alphabet is the clearest recent case: Q2 2026 net income of $112.2 billion against $28.2 billion a year earlier, a 298% increase, driven by a $99 billion unrealised gain on equity securities it holds. Revenue grew 24% and operating income 30%. The business grew respectably; the bottom line grew spectacularly, for a reason that had nothing to do with operations.',
      },
      {
        question: 'What is a good net profit margin?',
        answer:
          'Only comparable within an industry. Grocery retail runs on low single-digit net margins by structure, while software companies routinely post 20% or more. Neither fact says anything about management quality. The useful comparisons are a company against its own margin history and against direct competitors, where a widening or narrowing trend genuinely signals something.',
      },
      {
        question: 'Can net income be negative and the company still be healthy?',
        answer:
          'Yes. A business investing heavily ahead of revenue, or one absorbing a genuine one-time charge, can post a loss in a period without anything being structurally wrong. What matters is why. A loss caused by a single disclosed legal settlement is a different situation from a loss caused by costs persistently exceeding revenue, and the income statement shows which one you are looking at.',
      },
      {
        question: 'Where do I find net income?',
        answer:
          'It is the final line of the income statement in a company’s Form 10-Q or Form 10-K, filed with the SEC and free to read on EDGAR, and it appears in the earnings press release issued as a Form 8-K exhibit. Read the lines above it rather than the total alone — operating income, other income, and the tax provision are where the explanation lives.',
      },
    ],
    body: `<p>Net income is the last line of the income statement: what remains after every cost, interest payment, tax and one-off item has been subtracted from revenue. It is called the bottom line because that is literally where it sits, and it is the number that flows into <a href="/stocks/eps-explained">earnings per share</a> and from there into most valuation ratios.</p>
<p>It is also the line most easily knocked off course, because everything unusual that happens to a company in a given period ends up in it. In the second quarter of 2026, Alphabet reported net income of $112.2 billion against $28.2 billion a year earlier, a 298% increase. Its actual business grew 30%.</p>
<p>Understanding the gap between those two numbers is most of what reading this line well requires.</p>
<h2>The Descent Down the Income Statement</h2>
<p>The income statement is a descent. Revenue at the top, then progressively more subtracted at each step:</p>
<div class="table-scroll"><table><thead><tr><th>Line</th><th>What it subtracts</th><th>What it tells you</th></tr></thead><tbody><tr><td>Revenue</td><td>—</td><td>Total sales booked in the period</td></tr><tr><td>Gross profit</td><td>Cost of goods sold</td><td>Margin on the product itself</td></tr><tr><td>Operating income</td><td>Operating expenses</td><td>Profit from running the business</td></tr><tr><td>Pre-tax income</td><td>Interest, other income and expense</td><td>Adds financing and investment effects</td></tr><tr><td><strong>Net income</strong></td><td>Taxes</td><td>What is left for shareholders</td></tr></tbody></table></div>
<p>The critical structural point: <strong>everything unusual enters below the operating line</strong>. Investment gains and losses, one-time tax settlements, legal charges, restructuring, gains on asset sales. Operating income is insulated from all of it. Net income is not.</p>
<h2>Alphabet&rsquo;s $99 Billion Line</h2>
<p>Alphabet&rsquo;s second quarter of 2026 is the clearest recent illustration available, and every figure comes from the company&rsquo;s own <a href="https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm" target="_blank" rel="noopener noreferrer nofollow">Q2 2026 earnings exhibit</a> filed with the SEC.</p>
<div class="table-scroll"><table><thead><tr><th>Alphabet, quarter ended</th><th>Q2 2026</th><th>Q2 2025</th><th>Change</th></tr></thead><tbody><tr><td>Revenues</td><td>$119.8B</td><td>$96.4B</td><td>+24%</td></tr><tr><td>Operating income</td><td>$40.8B</td><td>$31.3B</td><td>+30%</td></tr><tr><td>Other income (expense)</td><td>$98.0B</td><td>$2.7B</td><td>—</td></tr><tr><td>&nbsp;&nbsp;of which gain on equity securities</td><td>$99.0B</td><td>$1.3B</td><td>—</td></tr><tr><td>Net income</td><td>$112.2B</td><td>$28.2B</td><td>+298%</td></tr><tr><td>Diluted EPS</td><td>$9.11</td><td>$2.31</td><td>+294%</td></tr></tbody></table></div>
<h3>What the operating line says</h3>
<p>Read the two middle rows against the last two. Operating income, which covers the business of selling advertising, cloud services and subscriptions, grew 30%, with operating margin expanding two points to 34%. That is a genuinely strong quarter.</p>
<h3>What the other-income line added</h3>
<p>Then other income contributed $98.0 billion, against $2.7 billion the year before, almost entirely from a $99.0 billion gain on equity securities: an accounting revaluation of stakes Alphabet holds in other companies. Nothing was sold. No cash arrived. The holdings were marked up in value and the gain flowed through the income statement.</p>
<p>Net income consequently quadrupled. A reader who saw only the bottom line would conclude Alphabet had transformed. A reader who stopped at operating income would conclude it had a strong quarter. The second reader is closer to right.</p>
<div class="callout callout-info"><p>This distortion was large enough to move an index statistic. FactSet reported that S&amp;P 500 companies delivered aggregate Q2 2026 earnings <a href="https://insight.factset.com/sp-500-earnings-season-update-july-24-2026" target="_blank" rel="noopener noreferrer nofollow">39.3% above estimates</a>, where the five-year norm is 7.0%. Excluding Alphabet&rsquo;s gain alone, the figure was 12.6%. One line item in one company moved the whole-market number by nearly 27 percentage points.</p></div>
<h2>The Same Thing Happens in Reverse</h2>
<p>One-time items cut both ways, and a charge distorts a comparison for two years running: once when it lands, and again the following year when growth is measured against the depressed base.</p>
<p>Apple&rsquo;s fiscal 2024 is the mirror image of Alphabet. On September 10, 2024 Europe&rsquo;s top court reinstated the 2016 State Aid ruling against Apple, and Apple recorded a one-time income tax charge of <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm" target="_blank" rel="noopener noreferrer nofollow">$10.2 billion net</a>: $15.8 billion payable to Ireland, offset by a $4.8 billion US foreign tax credit and $823 million of reduced unrecognized tax benefits.</p>
<p>Reported net income came in at $93.7 billion against an adjusted $104.0 billion.</p>
<p>The following year compounded it. Apple&rsquo;s fiscal 2025 net income of $112.0 billion represents 19.5% growth against the reported figure, and 7.7% against the adjusted one. Same company, same year, two defensible growth rates that differ by twelve percentage points, entirely because of where the comparison starts.</p>
<h2>Why Operating Income Is Often the Better Line</h2>
<p>Since the disruptive items sit below it, operating income answers the question most investors are actually asking: did the business get better at what it does?</p>
<p>It is not a complete substitute. Interest expense is a real obligation for an indebted company, and tax is a real cost. A business with heavy borrowings can post healthy operating income and thin net income, and that difference genuinely matters. But when net income and operating income diverge sharply, the divergence, not the bottom line, is the story, and reading the lines between them is where the explanation is.</p>
<div class="callout callout-tip"><p>A fast diagnostic: put operating income growth next to net income growth. If they track each other, the bottom line is describing the business. If they diverge by tens of percentage points, something below the operating line is doing the work, and the &ldquo;other income&rdquo; and tax provision lines will name it.</p></div>
<h2>Net Income Is Not Cash</h2>
<p>Net income includes items that never touch a bank account. Depreciation subtracts value without cash leaving. Stock-based compensation is an expense the company pays in stock rather than cash. And unrealised investment gains, Alphabet&rsquo;s $99 billion among them, add profit with no cash arriving at all.</p>
<p>This is why <a href="/stocks/free-cash-flow-explained">free cash flow</a> is worth reading alongside. Dividends and buybacks are paid in cash, not in accounting profit. A company reporting strong net income while free cash flow deteriorates is a specific pattern worth investigating, The reverse case, where heavy depreciation depresses net income while cash generation stays strong, is common in capital-intensive industries and is not a problem.</p>
<h3>Which way the gap runs</h3>
<p>The direction of the gap is the useful part. Non-cash charges such as depreciation and amortisation push net income <em>below</em> cash generation, which is conservative and unremarkable. Non-cash gains push it <em>above</em>, which is the direction that flatters. Alphabet&rsquo;s quarter is the extreme version: $99 billion added to profit with no corresponding cash, so the cash flow statement for that period looks nothing like the income statement.</p>
<p>Whenever the two tell different stories, the cash statement is the one that cannot be revalued.</p>
<h2>Net Margin: The Percentage Version</h2>
<p>Net margin is net income divided by revenue. Alphabet&rsquo;s Q2 2026 net margin, on those reported figures, was roughly 94%. That is not a fact about Google&rsquo;s business; it is a demonstration of how thoroughly a one-time gain can break a ratio. Its operating margin of 34% is the meaningful number.</p>
<p>Margins are structural by industry. Grocery retail runs on low single digits because that is how the business works. Software routinely exceeds 20%. Comparing across industries tells you about the industries, not the companies. The comparisons that carry information are a company against its own margin history, and against direct competitors.</p>
<h2>What Net Income Actually Funds</h2>
<p>Once the figure is struck, it splits two ways. Part is returned to shareholders as dividends or used to repurchase stock; the rest becomes retained earnings and stays in the business, accumulating on the balance sheet as equity.</p>
<p>That split is where net income connects to things investors care about directly. The dividend payout ratio is dividends divided by net income, so a company distributing more than it earns has a ratio above 100% and is funding the difference from reserves or borrowing. Return on equity divides net income by shareholders&rsquo; equity. Both inherit whatever distorted the bottom line: a one-time gain flatters return on equity and makes a payout ratio look comfortable in a year when the underlying business could not have supported it.</p>
<p>Apple&rsquo;s fiscal 2025 net income of <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm" target="_blank" rel="noopener noreferrer nofollow">$112.0 billion</a> is what funded both its dividend and the repurchases that cut its share count 2.6% that year. Net income is not an abstraction. It is the pool those decisions are drawn from, so a temporarily inflated figure can support commitments that a normal year would not.</p>
<h2>A Five-Line Check on Any Bottom Line</h2>
<p>Five checks separate a number you can use from one you have merely read:</p>
<ul>
<li><strong>Compare it with operating income for the same period.</strong> Divergence is the signal; convergence means the bottom line is describing the business.</li>
<li><strong>Read the &ldquo;other income (expense)&rdquo; line.</strong> This is where investment gains, losses and most surprises live, and it is usually one line above the tax provision.</li>
<li><strong>Check the tax provision for anything unusual.</strong> Settlements, rulings and one-time charges frequently land here rather than in operating costs, as Apple&rsquo;s did.</li>
<li><strong>Look at three to five years, not one.</strong> A single period cannot distinguish a trend from an event, and one-time items distort two consecutive comparisons rather than one.</li>
<li><strong>Cross-check against cash from operations.</strong> If profit is rising while operating cash flow is flat or falling, the divergence needs an explanation before the profit figure means much.</li>
</ul>
<p>None of this requires accounting training. All five lines sit on one page of any quarterly filing, and the company is obliged to disclose them.</p>
<h2>Why a Single Period Is Never Enough</h2>
<ul>
<li><strong>It absorbs everything unusual.</strong> One-time gains, charges and revaluations all land here, and single-period comparisons mislead as a result.</li>
<li><strong>It is not cash.</strong> Non-cash items can move it substantially in either direction.</li>
<li><strong>It reflects accounting choices.</strong> Depreciation schedules, revenue recognition timing and impairment judgements all shape it.</li>
<li><strong>It distorts the following year too.</strong> A charge creates a depressed base that flatters the next year&rsquo;s growth rate, as Apple&rsquo;s fiscal 2025 shows.</li>
<li><strong>Total profit says nothing about efficiency.</strong> A company earning $1 billion on $100 billion of revenue and one earning $1 billion on $3 billion are not comparable businesses.</li>
</ul>
<h2>The Bottom Line</h2>
<p>Net income is the most complete profit figure a company publishes and the least stable. Everything genuinely exceptional that happens in a period lands in it, which makes it excellent for answering &ldquo;what happened this quarter&rdquo; and unreliable for answering &ldquo;is this business improving&rdquo;.</p>
<p>Read it as the end of a sequence rather than a standalone number. Check operating income for the underlying trend, read the other-income and tax lines when the two diverge, and confirm against cash flow. Alphabet&rsquo;s 298% and Apple&rsquo;s 19.5% were both accurate and both mostly about something other than the business &mdash; which is the case more often than the prominence of this line suggests.</p>
<p>For what sits above it, see <a href="/stocks/revenue-explained">revenue explained</a>; for the per-share version, see <a href="/stocks/eps-explained">earnings per share</a>.</p>`,
  },
  {
    slug: 'price-to-earnings-ratio-explained',
    title: "The P/E Ratio: Formula, Trailing vs. Forward, and Why Cheap Often Isn't",
    seoTitle: 'P/E Ratio Explained: Formula, Trailing vs. Forward, Examples',
    seoDescription:
      'What the price-to-earnings ratio measures, why the S&P 500 trades at 29.6 against a long-run mean of 16.2, and the conditions under which a low P/E is a warning rather than a bargain.',
    researchNote:
      "S&P 500 trailing P/E of 29.56 (Sep 2, 2026), long-run mean 16.23, median 15.08, minimum 5.31 (Dec 1917) and maximum 123.73 (May 2009) read directly off multpl's S&P 500 P/E series. Shiller CAPE of 41.93 (Sep 2, 2026), mean 17.40, median 16.11, minimum 4.78 (Dec 1920) and maximum 44.19 (Dec 1999) read off multpl's CAPE series. Apple EPS figures ($7.46 diluted FY2025; $6.08 GAAP and $6.75 adjusted FY2024) from the Q4 FY2025 and Q4 FY2024 Form 8-K exhibits on SEC EDGAR, including the one-time $10.2B State Aid charge separating the two FY2024 figures. Beat-rate data from FactSet Earnings Insight, July 24 2026: 86% of S&P 500 companies above estimates against a 5-year average of 78% and 10-year average of 76%. The Company A/B table is illustrative arithmetic, labelled as such in the body, not a real security.",
    citations: [MULTPL_PE, MULTPL_CAPE, APPLE_8K, APPLE_8K_FY24, FACTSET_EI],
    keyTakeaways: [
      'P/E is share price divided by earnings per share — what the market pays for each dollar of annual profit.',
      'The S&P 500 traded at a trailing P/E of 29.56 on September 2, 2026, against a long-run mean of 16.23 and a median of 15.08.',
      'Trailing P/E uses the last four reported quarters; forward P/E uses analyst estimates for the next four. Forward is almost always the lower, more optimistic number.',
      'A high P/E is a statement about expected growth, not a verdict of "expensive". A low one is frequently the market pricing in a decline it can already see.',
      'The ratio breaks entirely when earnings collapse: the index P/E hit 123.73 in May 2009 because the denominator nearly vanished, not because stocks were dear.',
      'P/E is only comparable within a sector, and only between companies whose earnings are calculated on the same basis.',
      'The cyclically adjusted CAPE, which averages ten years of inflation-adjusted earnings, stood at 41.93 against a December 1999 record of 44.19.',
    ],
    faq: [
      {
        question: 'What is a good P/E ratio?',
        answer:
          "There is no universal figure, because the number encodes growth expectations that differ enormously by industry. A utility at 18x and a software company at 40x can both be reasonably valued. The only useful comparisons are against the same company's own history and against direct sector peers. For orientation, the S&P 500's long-run mean trailing P/E is 16.23, and it stood at 29.56 in September 2026.",
      },
      {
        question: 'What is the difference between trailing and forward P/E?',
        answer:
          "Trailing P/E divides the current share price by the last four quarters of actual reported earnings. Forward P/E divides it by analysts' consensus estimate for the next four quarters. Trailing is factual but backward-looking; forward is relevant but an opinion, and since estimates usually assume growth, forward P/E is normally the lower of the two. A large gap between them means the market is pricing in a substantial earnings change.",
      },
      {
        question: 'Does a low P/E mean a stock is cheap?',
        answer:
          'Often it means the opposite. Price falls faster than reported earnings when the market anticipates a decline, so the ratio drops before the deterioration reaches the accounts. This is why cyclical companies look statistically cheapest at the top of their cycle, with peak earnings in the denominator, and most expensive at the bottom. A low P/E is a question to investigate, not a conclusion.',
      },
      {
        question: 'Why can a P/E ratio be enormous, or missing entirely?',
        answer:
          "Because the denominator can approach or cross zero. A company with negative earnings has no meaningful P/E and providers usually show it blank. A company whose profits have collapsed but whose price has not shows an extreme reading — the S&P 500's trailing P/E reached 123.73 in May 2009 for exactly this reason, at a point when stocks were arguably at their most attractive in a generation.",
      },
      {
        question: 'What is the CAPE or Shiller P/E?',
        answer:
          'The cyclically adjusted price-to-earnings ratio divides price by the average of the past ten years of inflation-adjusted earnings rather than a single year. Averaging a full business cycle stops one distorted year dominating the ratio, which is the flaw that breaks ordinary P/E at cycle turning points. CAPE stood at 41.93 in September 2026, against a long-run mean of 17.40 and an all-time high of 44.19 in December 1999.',
      },
      {
        question: 'Should I use GAAP or adjusted earnings in the denominator?',
        answer:
          'Be consistent, and know which one you have. A P/E built on adjusted EPS is not comparable with one built on GAAP EPS, and adjusted earnings are almost always higher, so the resulting ratio is lower and more flattering. Financial summary pages rarely state which basis they use. When a valuation actually matters, take EPS from the income statement in the filing rather than from a summary page.',
      },
    ],
    body: `<p>The price-to-earnings ratio divides a company&rsquo;s share price by its earnings per share. The result is how many dollars the market is currently paying for each dollar of annual profit. A stock at $60 earning $3 a share trades at 20 times earnings.</p>
<p>It is the most quoted valuation figure in investing and the most casually misread. The persistent error is treating it as a verdict, where high means expensive and low means cheap, when it is a statement about what the market expects to happen next, wrapped around a denominator that is least reliable at exactly the moments the ratio matters most.</p>
<h2>What You Are Really Buying at 20 Times</h2>
<p><strong>P/E = share price &divide; earnings per share</strong></p>
<p>Read literally it is a payback period: at 20&times;, you are paying twenty years of current profit for a claim on the business. Nobody expects earnings to stay flat for twenty years, which is the point. The multiple is the market&rsquo;s summary of everything it believes about future growth, durability and risk, compressed into one figure.</p>
<p>A company at 40&times; is not being called expensive. It is being credited with growth that will make today&rsquo;s earnings look small. A company at 8&times; is not being called cheap. It is being warned about.</p>
<h2>Where the Market Sits Now</h2>
<p>Context matters more than the absolute number. As of September 2, 2026, the S&amp;P 500&rsquo;s trailing P/E stood at <a href="https://www.multpl.com/s-p-500-pe-ratio" target="_blank" rel="noopener noreferrer nofollow">29.56</a>, against a long-run mean of 16.23 and a median of 15.08 for a series running back to the nineteenth century (multpl, 2026).</p>
<div class="table-scroll"><table><thead><tr><th>S&amp;P 500 trailing P/E</th><th>Value</th><th>When</th></tr></thead><tbody><tr><td>Current</td><td>29.56</td><td>September 2, 2026</td></tr><tr><td>Long-run mean</td><td>16.23</td><td>—</td></tr><tr><td>Long-run median</td><td>15.08</td><td>—</td></tr><tr><td>All-time low</td><td>5.31</td><td>December 1917</td></tr><tr><td>All-time high</td><td>123.73</td><td>May 2009</td></tr></tbody></table></div>
<p>The market trades at roughly 1.8 times its historical average multiple. That is a fact, not a forecast. Elevated multiples have persisted for years at a stretch, and the index composition has shifted toward higher-margin businesses that plausibly deserve higher multiples than the railroads and manufacturers that dominated it a century ago.</p>
<h2>Trailing and Forward Are Different Claims</h2>
<p><strong>Trailing P/E</strong> uses the last four quarters of reported earnings. It is factual and backward-looking. <strong>Forward P/E</strong> uses analysts&rsquo; consensus for the next four quarters. It is relevant and hypothetical.</p>
<p>Because estimates generally assume growth, forward P/E is normally lower than trailing, which makes any stock look cheaper on a forward basis. That is not manipulation, just what the arithmetic does when the denominator is expected to rise. But it means a quoted P/E is only meaningful once you know which one it is.</p>
<p>It also helps to know how demanding those estimates are as a bar. During the 2026 second-quarter reporting season, <a href="https://insight.factset.com/sp-500-earnings-season-update-july-24-2026" target="_blank" rel="noopener noreferrer nofollow">86% of S&amp;P 500 companies</a> reported earnings above estimates. Over the previous five years that figure averaged 78%, and over ten years 76% (FactSet, 2026). Consensus is a bar companies help set and then usually clear.</p>
<p>Treat it as a reference point rather than an independent forecast.</p>
<div class="callout callout-tip"><p>When comparing two companies&rsquo; P/E ratios, confirm both come from the same basis: both trailing or both forward, both GAAP or both adjusted. Mixing them is the most common way a comparison silently becomes meaningless, and summary pages rarely label which they show.</p></div>
<h2>Why the Denominator Is the Weak Point</h2>
<p>Price is unambiguous. Earnings are an accounting output, and everything that distorts earnings per share flows straight into the ratio.</p>
<h3>One charge, two valuations</h3>
<p>Apple&rsquo;s fiscal 2024 shows this cleanly. Reported GAAP diluted EPS was <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm" target="_blank" rel="noopener noreferrer nofollow">$6.08</a>, depressed by a one-time $10.2 billion tax charge from the EU&rsquo;s highest court reinstating the Commission&rsquo;s State Aid decision. Excluding it, Apple&rsquo;s own adjusted figure was $6.75.</p>
<p>At any given share price those two denominators produce P/E ratios about 10% apart: same company, same day, same filing.</p>
<h3>When earnings vanish, the ratio inverts</h3>
<p>Scale that up and the ratio breaks completely. The index P/E of 123.73 in May 2009 did not mean stocks were the most expensive in history. It meant aggregate earnings had collapsed in the financial crisis while prices had begun recovering, leaving almost nothing in the denominator. At that reading, equities were close to their most attractive entry point in a generation.</p>
<p>A ratio that reads &ldquo;dangerously expensive&rdquo; at the bottom of a crash is not measuring what its users think.</p>
<h2>Why a Low P/E Is Often a Warning</h2>
<p>The market usually reprices a stock before the accounts catch up. Price falls first; reported earnings, which describe the past, fall later. In between, the ratio drops &mdash; which looks like a bargain appearing and is often deterioration becoming visible.</p>
<p>This is sharpest in cyclical industries. A steelmaker or homebuilder at the peak of its cycle posts record earnings, and its P/E looks lowest precisely when the next move is down. The same company at the trough, earning almost nothing, shows a high or undefined ratio just as recovery begins. For <a href="/stocks/cyclical-stocks-explained">cyclicals</a>, the ratio inverts the signal a naive reading takes from it.</p>
<div class="callout callout-info"><p>Three questions turn a low P/E from a screen result into a decision. Is the sector cyclical, and where is it in that cycle? Are the trailing earnings inflated by anything non-recurring? And is the forward estimate meaningfully below the trailing figure, meaning analysts already expect the denominator to shrink?</p></div>
<h2>Comparability: Sector, and Not Much Beyond It</h2>
<p>Multiples differ structurally by industry for real reasons. High-margin, low-capital software businesses support higher multiples than capital-intensive utilities. Banks, whose earnings depend on leverage and provisioning judgements, are conventionally valued on book value alongside earnings.</p>
<h3>Identical businesses, different share counts</h3>
<p>Two identical businesses can also carry very different EPS purely through capital structure. Consider illustrative arithmetic, not real securities:</p>
<div class="table-scroll"><table><thead><tr><th></th><th>Company A</th><th>Company B</th></tr></thead><tbody><tr><td>Net income</td><td>$500M</td><td>$500M</td></tr><tr><td>Shares outstanding</td><td>100M</td><td>500M</td></tr><tr><td>EPS</td><td>$5.00</td><td>$1.00</td></tr><tr><td>Share price</td><td>$100</td><td>$20</td></tr><tr><td>P/E</td><td>20&times;</td><td>20&times;</td></tr></tbody></table></div>
<p>The EPS figures differ fivefold; the P/E ratios are identical. This is exactly what the ratio is for &mdash; it normalizes away the share count, so it permits comparisons that raw <a href="/stocks/eps-explained">EPS</a> does not.</p>
<h2>CAPE: Smoothing Out the Cycle</h2>
<p>The cyclically adjusted P/E, or Shiller P/E, attacks the denominator problem directly by dividing price not by one year of earnings but by the average of the past ten, adjusted for inflation. Averaging a full business cycle prevents a single distorted year from dominating.</p>
<p>On September 2, 2026, CAPE stood at <a href="https://www.multpl.com/shiller-pe" target="_blank" rel="noopener noreferrer nofollow">41.93</a>, against a long-run mean of 17.40, a median of 16.11, and an all-time high of 44.19 recorded in December 1999 (multpl, 2026). The current reading sits within a few points of the dot-com peak.</p>
<p>CAPE has its own critics. Ten-year averaging carries forward earnings from an economy that may no longer resemble the present one, accounting standards have changed across the window, and it has signalled overvaluation through extended periods in which markets kept rising. It is long-horizon context, not a timing tool.</p>
<h2>PEG: Putting Growth Into the Denominator</h2>
<p>The most useful single adjustment to P/E is to divide it by the expected earnings growth rate. A company on 30&times; earnings growing profits 30% a year has a PEG of 1.0; one on 30&times; growing at 5% has a PEG of 6.0. The multiples are identical and the propositions are not remotely alike.</p>
<p>A PEG near or below 1.0 is conventionally treated as reasonable, though the convention is rougher than it sounds. The growth rate is a forecast, so PEG inherits all the uncertainty of the estimate and then compounds it by putting that estimate in the denominator. A modest error in the growth assumption produces a large error in the ratio. PEG works best as a sanity check on whether a high multiple is supported by any plausible growth path, rather than as a precise valuation.</p>
<h2>Four Habits That Keep the Ratio Honest</h2>
<p>In practice, the ratio earns its keep as a prompt rather than a screen output. Four habits make the difference:</p>
<ul>
<li><strong>Chart the company&rsquo;s own P/E over five to ten years.</strong> A business trading at the low end of its own historical range is a more meaningful observation than one trading below an arbitrary market average.</li>
<li><strong>Compare against three or four named peers</strong> in the same industry, on the same basis, rather than against the index.</li>
<li><strong>Look at trailing and forward together.</strong> When forward sits well below trailing, the market expects earnings to rise; when it sits above, it expects them to fall. The direction of that gap often carries more information than either number alone.</li>
<li><strong>Read what is in the denominator.</strong> Open the income statement, check for one-time items, and confirm whether you are looking at GAAP or adjusted figures.</li>
</ul>
<p>None of this converts P/E into a decision on its own. It is one input among several, and the specific mistake worth avoiding is letting a single multiple substitute for reading the business.</p>
<h2>The Blind Spots</h2>
<ul>
<li><strong>It ignores debt entirely.</strong> Two companies on the same multiple can carry completely different balance-sheet risk, which is why <a href="/stocks/enterprise-value-explained">enterprise value</a> multiples exist.</li>
<li><strong>It is undefined for loss-making companies.</strong> Any business with negative earnings has no ratio at all, which excludes much of the early-growth market.</li>
<li><strong>It says nothing about the growth rate.</strong> The PEG ratio divides P/E by expected earnings growth for this reason: 30&times; on 30% growth is a different proposition from 30&times; on 5%.</li>
<li><strong>It inherits every accounting choice.</strong> GAAP versus adjusted, one-time items, revenue recognition timing &mdash; every one of them lands in the denominator.</li>
<li><strong>It is not cash.</strong> Earnings can diverge from <a href="/stocks/free-cash-flow-explained">free cash flow</a> for years, and cash is what funds dividends and buybacks.</li>
</ul>
<h2>The Bottom Line</h2>
<p>P/E is a good first question and a poor final answer. It compresses growth expectations, risk and accounting policy into one figure, then presents it with a precision it does not have.</p>
<p>Use it to compare a company against its own history and against direct sector peers, always on a stated basis. Treat an unusually low multiple as something to explain rather than something to buy, particularly in cyclical industries. Check what the trailing earnings actually contain. And keep the market context in view: at 29.56 against a 16.23 mean, the index-level multiple is doing a great deal of work that individual stock analysis cannot see.</p>
<p>For the denominator itself, see <a href="/stocks/eps-explained">earnings per share explained</a>; for what earnings leave out, see <a href="/stocks/net-income-explained">net income</a>.</p>`,
  },
  {
    slug: 'eps-explained',
    title: 'Earnings Per Share: Formula, Basic vs. Diluted, and What Buybacks Hide',
    seoTitle: 'Earnings Per Share (EPS): Formula, Basic vs. Diluted, Examples',
    seoDescription:
      'How EPS is calculated, why basic and diluted differ, and how share buybacks let earnings per share grow faster than actual profit — worked through Apple\'s audited FY2025 filing.',
    researchNote:
      'Every Apple figure is read directly off the Q4 FY2025 and Q4 FY2024 Form 8-K financial exhibits on SEC EDGAR. FY2025: net sales $416,161M, net income $112,010M, basic EPS $7.49, diluted EPS $7.46, basic weighted-average shares 14,948,500 thousand, diluted 15,004,697 thousand. FY2024 GAAP: net sales $391,035M, net income $93,736M, basic EPS $6.11, diluted EPS $6.08, basic shares 15,343,783 thousand. Critically, FY2024 GAAP results carry a one-time $10.2B net income tax charge from the September 10 2024 CJEU State Aid ruling; Apple presents adjusted FY2024 net income of $103,982M and adjusted diluted EPS of $6.75 in that same filing, so the article decomposes the headline growth on both bases rather than quoting the flattering GAAP comparison alone. Derived figures (+19.5% GAAP net income, +7.7% adjusted, +22.7% GAAP diluted EPS, +10.5% adjusted, -2.6% share count, 3.2- and 2.8-point buyback gaps, 56.2M dilution) were each recomputed from those filed numbers. Buyback aggregates from the S&P Dow Jones Indices Q1 2025 release: $293.5B quarterly record, $999.2B trailing twelve months to March 2025, 384 companies buying back at least $5M in the quarter.',
    citations: [APPLE_8K, APPLE_8K_FY24, SPDJI_BUYBACKS, FACTSET_EI, MULTPL_PE],
    keyTakeaways: [
      'EPS is net income divided by weighted-average shares outstanding — a per-share slice of accounting profit, not a measure of the business itself.',
      'Basic EPS uses shares actually outstanding; diluted adds the shares options, restricted stock and convertibles would create. Diluted is the conservative figure and the one to track.',
      'Apple reported basic EPS of $7.49 and diluted EPS of $7.46 for fiscal 2025, on net income of $112.0 billion and 14.95 billion basic shares.',
      "Apple's diluted EPS grew 22.7% year over year on a GAAP basis — but only 10.5% measured against the prior year adjusted for a one-time $10.2 billion EU tax charge.",
      'Buybacks cut the share count 2.6%, adding roughly 3 percentage points to EPS growth that came from the denominator rather than from earning more.',
      'S&P 500 companies repurchased a record $293.5 billion in Q1 2025 alone, so the denominator effect is market-wide, not an Apple quirk.',
      'A single headline EPS growth rate can conceal a depressed prior-year base, a one-time charge, and a buyback all at once — decompose it before believing it.',
    ],
    faq: [
      {
        question: 'What is the difference between basic and diluted EPS?',
        answer:
          'Basic EPS divides net income by the weighted-average shares actually outstanding. Diluted EPS also counts shares that would exist if every in-the-money option, restricted stock unit and convertible security were exercised or converted. Diluted is always equal to or lower than basic and is the more conservative figure. Apple reported $7.49 basic and $7.46 diluted for fiscal 2025 — a gap of 56.2 million shares, about 0.4%.',
      },
      {
        question: 'Why is EPS calculated on weighted-average shares rather than the year-end count?',
        answer:
          'Because the share count moves during the year as buybacks retire stock and equity compensation issues it. A year-end snapshot would measure a full year of profit against a count that existed on one day. The weighted average reflects how many shares were outstanding for how much of the period, which is why a company that repurchased heavily in its final quarter sees only part of that benefit in the current year.',
      },
      {
        question: 'Can a company increase EPS without increasing profit?',
        answer:
          'Yes, and it is routine. Repurchasing stock shrinks the denominator, so the same net income divides across fewer shares. Apple cut its basic share count 2.6% in fiscal 2025, which added roughly 3 percentage points to EPS growth over and above whatever the business earned. A buyback is a legitimate return of capital and continuing holders do own more of the company afterwards — but EPS growth and profit growth are different claims.',
      },
      {
        question: 'Why can the same company report two very different EPS growth rates?',
        answer:
          "Because the prior-year base can be distorted. Apple's fiscal 2024 GAAP results included a one-time $10.2 billion income tax charge from the European Court of Justice State Aid ruling. Measured against that depressed base, fiscal 2025 diluted EPS grew 22.7%. Measured against the adjusted figure Apple published in the same filing, it grew 10.5%. Both are arithmetically correct; only one describes the business.",
      },
      {
        question: 'What is the difference between GAAP EPS and adjusted EPS?',
        answer:
          'GAAP EPS follows standard accounting rules. Adjusted or non-GAAP EPS is the company’s own figure with items management considers unrepresentative removed — restructuring charges, acquisition costs, and often stock-based compensation. Adjusted is almost always the higher number, and the company chooses the exclusions, so the reconciliation table between the two is the part worth reading. Exclusions that recur every quarter are not one-time by any ordinary meaning of the word.',
      },
      {
        question: 'Is a higher EPS always better?',
        answer:
          'Not across companies. EPS depends on how many shares a company happens to have issued, so a business with few shares shows a larger EPS than an identical business with many. Comparing raw EPS between two companies tells you almost nothing. EPS is useful for tracking one company against its own history, and as the denominator of the P/E ratio, which does allow comparison.',
      },
      {
        question: 'Where do I find a company’s EPS?',
        answer:
          'On the income statement in its quarterly Form 10-Q or annual Form 10-K, filed with the SEC and free to read on EDGAR, and in the earnings press release issued as a Form 8-K exhibit. Both basic and diluted figures must be disclosed, along with the weighted-average share counts used to compute them.',
      },
    ],
    body: `<p>Earnings per share takes a company&rsquo;s profit and divides it by the number of shares it has issued. That is the entire calculation. What makes it worth reading carefully is that both halves of the fraction move for reasons that have nothing to do with whether the business earned more money.</p>
<p>Apple&rsquo;s fiscal 2025 results make the point better than any hypothetical. Diluted EPS grew 22.7%. Almost none of that was the business getting 22.7% better. Unpacking where it actually came from covers most of what you need to know about reading EPS.</p>
<h2>The Slice a Single Share Represents</h2>
<p><strong>EPS = net income &divide; weighted-average shares outstanding</strong></p>
<p>It answers one narrow question: of the accounting profit recorded this period, how much is attributable to each share. It is not a measure of the company&rsquo;s size, its cash generation, or its value.</p>
<p>The denominator is a <em>weighted average</em> rather than a closing count for a practical reason. The share count moves all year: buybacks retire stock, equity compensation issues it. Measuring twelve months of profit against a single day&rsquo;s count would misstate the result. The weighted average reflects how many shares existed for how much of the period.</p>
<h2>Running the Formula on Apple&rsquo;s Filing</h2>
<p>Apple&rsquo;s fiscal year 2025 ended September 27, 2025. From the statements filed with its <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm" target="_blank" rel="noopener noreferrer nofollow">Q4 FY2025 Form 8-K</a>:</p>
<div class="table-scroll"><table><thead><tr><th>Twelve months ended</th><th>Sep 27, 2025</th><th>Sep 28, 2024 (GAAP)</th></tr></thead><tbody><tr><td>Net sales</td><td>$416,161M</td><td>$391,035M</td></tr><tr><td>Net income</td><td>$112,010M</td><td>$93,736M</td></tr><tr><td>Basic weighted-average shares</td><td>14,948.5M</td><td>15,343.8M</td></tr><tr><td>Diluted weighted-average shares</td><td>15,004.7M</td><td>15,408.1M</td></tr><tr><td>Basic EPS</td><td>$7.49</td><td>$6.11</td></tr><tr><td>Diluted EPS</td><td>$7.46</td><td>$6.08</td></tr></tbody></table></div>
<p>Check it yourself: $112,010M &divide; 14,948.5M shares = $7.4931, rounding to the $7.49 reported. The formula hides nothing. The interpretation is where the work is.</p>
<h2>Basic and Diluted: A 56-Million-Share Gap</h2>
<p>Companies report EPS twice. <strong>Basic</strong> uses shares actually outstanding. <strong>Diluted</strong> adds shares that would come into existence if every in-the-money option, restricted stock unit and convertible were exercised.</p>
<p>Apple&rsquo;s fiscal 2025 basic count was 14,948.5 million against a diluted count of 15,004.7 million, a difference of 56.2 million shares, roughly 0.4%. Those are equity awards not yet converted to ordinary stock, and they move basic EPS of $7.49 down to diluted EPS of $7.46.</p>
<p>Diluted is the figure to track, because those shares are a real claim on future profit. At Apple the gap is negligible. At a company paying much of its workforce in equity the gap runs to several percent, and the basic figure flatters the result materially.</p>
<div class="callout callout-tip"><p>When a headline quotes EPS without saying which version, assume it is whichever number looks better. Both are disclosed on the income statement of every 10-Q and 10-K on <a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany" target="_blank" rel="noopener noreferrer nofollow">EDGAR</a>, with the share counts used. Checking takes under a minute.</p></div>
<h2>Decomposing Apple&rsquo;s 22.7%</h2>
<p>Diluted EPS went from $6.08 to $7.46, or +22.7%. Three separate things produced that, and only one of them is Apple selling more.</p>
<h3>A starting point that was artificially low</h3>
<p>On September 10, 2024, the European Court of Justice reinstated the European Commission&rsquo;s State Aid decision, and Apple recorded a one-time income tax charge of <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm" target="_blank" rel="noopener noreferrer nofollow">$10.2 billion net</a> in fiscal 2024: $15.8 billion payable to Ireland, offset by a $4.8 billion US foreign tax credit and an $823 million reduction in unrecognized tax benefits. In the same filing, Apple published adjusted fiscal 2024 figures excluding it: net income of $103,982 million and diluted EPS of $6.75.</p>
<p>Measured against $6.75 rather than $6.08, fiscal 2025 diluted EPS grew <strong>10.5%</strong>, not 22.7%. Both numbers are arithmetically correct. They describe different things.</p>
<h3>A denominator that shrank</h3>
<p>Basic shares dropped 2.6%, from 15,343.8 million to 14,948.5 million &mdash; roughly 395 million shares retired through repurchases. The same profit across fewer shares produces a bigger number per share, worth about 3 percentage points of the GAAP growth rate and 2.8 points of the adjusted one.</p>
<h3>And, third, the business itself</h3>
<p>Revenue rose 6.4%. Adjusted net income rose 7.7%. That is a good year for a company of Apple&rsquo;s size, and it is not 22.7%.</p>
<div class="table-scroll"><table><thead><tr><th>Basis of comparison</th><th>Net income growth</th><th>Diluted EPS growth</th><th>Gap from buyback</th></tr></thead><tbody><tr><td>Against FY2024 as reported (GAAP)</td><td>+19.5%</td><td>+22.7%</td><td>3.2 points</td></tr><tr><td>Against FY2024 adjusted for the tax charge</td><td>+7.7%</td><td>+10.5%</td><td>2.8 points</td></tr></tbody></table></div>
<p>A 22.7% headline that is really about 7.7% of business growth, plus a distorted base, plus a buyback, is not a scandal. It is ordinary financial reporting, and it is exactly why the headline alone is not enough.</p>
<h2>The Buyback Effect Is Market-Wide</h2>
<p>Apple is not unusual here. S&amp;P 500 companies repurchased a record <a href="https://www.spglobal.com/spdji/en/corporate-news/article/sp-500-q1-2025-buybacks-set-quarterly-record-at-293-billion-up-206-helping-eps-growth" target="_blank" rel="noopener noreferrer nofollow">$293.5 billion</a> of their own stock in the first quarter of 2025 alone, and $999.2 billion over the preceding twelve months, with 384 index members repurchasing at least $5 million each (S&amp;P Dow Jones Indices, 2025). Across the index, a meaningful share of reported EPS growth in any period is denominator arithmetic.</p>
<div class="callout callout-info"><p><strong>The check that takes thirty seconds:</strong> put EPS growth and net income growth side by side. If EPS is growing meaningfully faster, look at the share count. If EPS is growing while net income is flat or falling, the growth is entirely buyback-driven and the business is not improving.</p></div>
<h2>GAAP EPS and the Company&rsquo;s Own Version</h2>
<p>Alongside the audited GAAP figure, most companies publish an <em>adjusted</em> EPS with items management regards as unrepresentative removed: restructuring, acquisition costs, litigation, and frequently stock-based compensation.</p>
<p>Apple&rsquo;s tax-charge adjustment is the honest version of this: a genuinely singular event, disclosed with a full reconciliation, and the adjusted figure produced the <em>lower</em> growth rate rather than the flattering one. Treat that as the benchmark for good practice.</p>
<p>The pattern worth distrusting is the opposite. Three things are worth checking in any reconciliation table:</p>
<ul>
<li><strong>Exclusions that recur.</strong> Restructuring charges in eight consecutive quarters are not one-time by any ordinary meaning of the word; they are the cost of running that business.</li>
<li><strong>Stock-based compensation removed.</strong> The single most consequential adjustment in technology. It is a real cost, settled in shares that dilute the holders reading the adjusted figure.</li>
<li><strong>An adjusted figure with no GAAP equivalent nearby.</strong> The reconciliation must be presented; a release that buries it pages from the headline is signalling which number it wants quoted.</li>
</ul>
<div class="callout callout-tip"><p>A quick sanity test on any adjusted EPS: add up the excluded items across the past three years. If the total is a large fraction of cumulative GAAP profit, those &ldquo;adjustments&rdquo; are not incidental to the business &mdash; they are a substantial part of it.</p></div>
<h2>Why Two Companies&rsquo; EPS Cannot Be Compared</h2>
<p>This is the most common misuse of the figure. EPS depends on how many shares a company happens to have issued, and that number is a historical accident of financing decisions rather than a fact about the business.</p>
<p>Consider two companies earning identical profit:</p>
<div class="table-scroll"><table><thead><tr><th></th><th>Company A</th><th>Company B</th></tr></thead><tbody><tr><td>Net income</td><td>$500M</td><td>$500M</td></tr><tr><td>Shares outstanding</td><td>100M</td><td>500M</td></tr><tr><td>EPS</td><td>$5.00</td><td>$1.00</td></tr><tr><td>Share price</td><td>$100</td><td>$20</td></tr><tr><td>P/E ratio</td><td>20&times;</td><td>20&times;</td></tr></tbody></table></div>
<p>Company A&rsquo;s EPS is five times Company B&rsquo;s. The businesses are identical, valued identically, and an investor putting $10,000 into either owns exactly the same claim on $500 million of profit. The only difference is that one company divided its equity into more pieces.</p>
<p>This is also why a stock split changes EPS and changes nothing else. A two-for-one split halves EPS overnight because the share count doubles; no shareholder is worse off. Any comparison that treats a higher EPS as a better company is reading the share count, not the performance.</p>
<h2>Trailing, Forward, and the Estimate EPS Is Judged Against</h2>
<p>Three versions circulate, and they answer different questions. <strong>Trailing EPS</strong> is the last four reported quarters: actual, audited, backward-looking. <strong>Forward EPS</strong> is the analyst consensus for the next four quarters &mdash; an estimate, and therefore an opinion. <strong>Current-quarter consensus</strong> is the specific number a company is measured against on earnings day.</p>
<p>That last one shapes how stocks move, and the scoring deserves a look. In the second quarter of 2026, <a href="https://insight.factset.com/sp-500-earnings-season-update-july-24-2026" target="_blank" rel="noopener noreferrer nofollow">86% of S&amp;P 500 companies reported EPS above estimates</a>. The five-year norm is 78%, the ten-year 76% (FactSet, 2026).</p>
<p>Roughly three companies in four beat expectations, every quarter, for a decade. That is not evidence that management consistently outperforms &mdash; it is evidence that the bar is set where it can be cleared. Companies guide analysts toward achievable numbers in the weeks before reporting, so a &ldquo;beat&rdquo; is closer to the base case than to good news. A stock can beat consensus and fall the same morning, because the market was pricing something better than the published estimate.</p>
<p>The magnitude data in the same report also shows how badly one item can distort an aggregate. Companies reported earnings 39.3% above estimates in that quarter, against a five-year norm of 7.0%. Strip out a single $98 billion gain at Alphabet and the figure was 12.6% (FactSet, 2026). One company moved the whole index statistic by 27 percentage points. It is the same lesson as Apple&rsquo;s tax charge, at market scale.</p>
<h2>Five Things the Number Cannot Tell You</h2>
<ul>
<li><strong>It is not comparable across companies.</strong> EPS depends on how many shares a company happens to have issued. Two identical businesses with different share counts report different EPS. This is why the <a href="/stocks/price-to-earnings-ratio-explained">P/E ratio</a> exists.</li>
<li><strong>It is accounting profit, not cash.</strong> Net income includes non-cash items. A company can report healthy EPS while <a href="/stocks/free-cash-flow-explained">free cash flow</a> deteriorates.</li>
<li><strong>It can be engineered upward.</strong> Buybacks raise EPS whether or not the business improved.</li>
<li><strong>One period tells you little.</strong> Seasonality, one-time items and base effects all distort a single comparison, as Apple&rsquo;s fiscal 2024 shows.</li>
<li><strong>Negative EPS is not disqualifying.</strong> A company investing ahead of revenue may post losses by design, though the case then rests entirely on future earnings.</li>
</ul>
<h2>How EPS Feeds the P/E Ratio</h2>
<p>EPS matters most as the denominator of price-to-earnings: share price &divide; EPS. Because P/E inherits EPS, it inherits every problem above. A P/E built on adjusted EPS is not comparable with one built on GAAP EPS.</p>
<p>The distortion can become total. The S&amp;P 500&rsquo;s trailing P/E reached <a href="https://www.multpl.com/s-p-500-pe-ratio" target="_blank" rel="noopener noreferrer nofollow">123.73 in May 2009</a> &mdash; not because stocks were expensive, but because aggregate earnings had collapsed, leaving almost nothing in the denominator (multpl). When EPS approaches zero, every ratio built on it stops working.</p>
<h2>The Bottom Line</h2>
<p>EPS is standardized, audited, and narrower than the weight placed on it. It tracks one company against its own past well and compares two companies badly. It reflects accounting profit rather than cash. And it moves on share count and base effects as readily as on performance.</p>
<p>Read the diluted figure. Keep GAAP and adjusted separate. Put EPS growth next to net income growth every time, and check what the prior-year base contained. Apple&rsquo;s 22.7% was three different stories stacked on top of each other &mdash; and the one about the business was the smallest of them.</p>
<p>For what sits underneath EPS, see <a href="/stocks/net-income-explained">net income explained</a> and <a href="/stocks/outstanding-shares-explained">outstanding shares</a>.</p>`
  },
];
