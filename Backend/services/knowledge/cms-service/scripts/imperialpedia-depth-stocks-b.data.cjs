'use strict';
/*
 * Depth-rewrite batch B — the cash-flow, share-count and top-line articles. Like batch A
 * these read off Apple's audited fiscal 2025 filing, but from the cash flow statement,
 * balance sheet and product-category tables rather than the income statement, so the
 * worked examples do not repeat batch A's.
 *
 * Consumed by publish-imperialpedia-depth-rewrites.cjs.
 */

// Apple Inc., twelve months ended Sept 27 2025 vs Sept 28 2024, per the Q4 FY2025 8-K.
//   operating cash flow  111,482 / 118,254 ($M)   → −5.7%
//   capital expenditure   12,715 /   9,447        → +34.6%
//   free cash flow        98,767 / 108,807        → −9.2%
//   dividends paid        15,421 /  15,234
//   buybacks              90,711 /  94,949
//   net income           112,010 /  93,736        → +19.5%
//   shares outstanding 14,773,260 / 15,116,786 (000) → −2.27%
//   cash + securities      ~132.4B / ~156.7B      → −24.3B
// Product categories FY2025 ($M): iPhone 209,586 · Services 109,158 · Wearables 35,686
//   · Mac 33,708 · iPad 28,023 · total 416,161.
const APPLE_8K = {
  title: 'Apple Inc. Q4 FY2025 Form 8-K, condensed consolidated financial statements (SEC EDGAR)',
  url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm',
};
const APPLE_8K_FY24 = {
  title: 'Apple Inc. Q4 FY2024 Form 8-K, including the $10.2B State Aid tax charge (SEC EDGAR)',
  url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm',
};
const SEC_NONGAAP = {
  title: 'Non-GAAP Financial Measures — Compliance and Disclosure Interpretations, Question 102.07 (SEC)',
  url: 'https://www.sec.gov/corpfin/non-gaap-financial-measures',
};
const SPDJI_BUYBACKS = {
  title: 'S&P 500 Q1 2025 Buybacks Set Quarterly Record at $293 Billion — S&P Dow Jones Indices',
  url: 'https://www.spglobal.com/spdji/en/corporate-news/article/sp-500-q1-2025-buybacks-set-quarterly-record-at-293-billion-up-206-helping-eps-growth',
};

module.exports = [
  {
    slug: 'outstanding-shares-explained',
    title: 'Outstanding Shares: Issued, Float, Treasury, and Why the Count Keeps Moving',
    seoTitle: 'Outstanding Shares: Definition, How to Calculate, and Why It Changes',
    seoDescription:
      'The difference between issued, outstanding, float and treasury shares, why the weighted average never matches the balance sheet, and what Apple retiring 343 million shares did to every per-share figure.',
    researchNote:
      "Share counts read off the balance sheet and income statement in Apple's Q4 FY2025 Form 8-K on SEC EDGAR: common shares outstanding 14,773,260 thousand at September 27 2025 against 15,116,786 thousand at September 28 2024; basic weighted-average shares 14,948,500 thousand against 15,343,783 thousand; diluted 15,004,697 thousand against 15,408,095 thousand. Repurchases of common stock $90,711M for the year. Derived figures (343,526 thousand net reduction, −2.27%, 56,197 thousand dilution gap, and the observation that the midpoint of the two balance-sheet counts sits within 0.02% of the reported basic weighted average) all recomputed from those filed numbers. Market-wide buyback context from the S&P Dow Jones Indices Q1 2025 release: $293.5B in the quarter, $999.2B over twelve months, 384 index members repurchasing at least $5M.",
    citations: [APPLE_8K, APPLE_8K_FY24, SPDJI_BUYBACKS, SEC_NONGAAP],
    keyTakeaways: [
      'Issued shares are every share ever created; outstanding shares are those currently held by investors; treasury shares are repurchased and held by the company, carrying no vote and no dividend.',
      'Float is narrower still: the outstanding shares actually available to trade, excluding closely held and restricted stock.',
      'Apple ended fiscal 2025 with 14.77 billion shares outstanding against 15.12 billion a year earlier, a net reduction of 343.5 million, or 2.27%.',
      'Two forces move the count in opposite directions at once: buybacks remove shares, equity compensation issues them.',
      'The weighted-average count used for EPS almost never matches the balance-sheet count, because it reflects how long each share existed during the period.',
      'Every per-share figure — earnings, dividends, book value, cash flow — sits on this denominator, so a change in the count moves all of them without the business changing.',
      'A buyback funded by borrowing, or made at an inflated price, destroys value while still improving the per-share optics.',
    ],
    faq: [
      {
        question: 'What is the difference between issued and outstanding shares?',
        answer:
          'Issued shares are all the shares a company has ever created. Outstanding shares are the portion currently held by investors. The difference is treasury stock: shares the company has bought back and holds itself. Treasury shares still exist legally but carry no voting rights and receive no dividends, and they are excluded from every per-share calculation.',
      },
      {
        question: 'What is the difference between outstanding shares and float?',
        answer:
          'Float is the subset of outstanding shares genuinely available to trade. It excludes stock held by insiders, founders, employees under lock-up, and strategic holders who are not selling. A company can have a large share count but a small float, which typically means wider bid-ask spreads and sharper price moves, since a modest order represents a larger fraction of what is actually available.',
      },
      {
        question: 'Why does the weighted-average share count differ from the balance sheet?',
        answer:
          'Because the count changes throughout the year and earnings are earned throughout the year too. The weighted average reflects how many shares existed for how much of the period. Apple reported 14,773,260 thousand shares outstanding at its fiscal 2025 year end but a basic weighted average of 14,948,500 thousand, which is higher because the count was larger for most of the year and fell as buybacks progressed.',
      },
      {
        question: 'Do buybacks always benefit shareholders?',
        answer:
          'No. A buyback increases each remaining holder\'s proportional ownership, which helps if the shares were bought below their worth. Bought above it, the company has converted cash into a worse asset, and the per-share figures still improve, which is what makes the practice easy to misread. Buybacks funded by borrowing deserve particular scrutiny, since they add a fixed obligation in exchange for an optical gain.',
      },
      {
        question: 'How does equity compensation change the share count?',
        answer:
          'It increases it. Stock options and restricted stock units become ordinary shares when they vest or are exercised, so every existing holder owns a slightly smaller fraction. This runs continuously and in the opposite direction to buybacks. At many technology companies a substantial part of the repurchase program does nothing more than offset the shares issued to staff, leaving the count flat while large sums are spent.',
      },
      {
        question: 'Where do I find a company\'s current share count?',
        answer:
          'On the cover page of any Form 10-Q or 10-K, which states shares outstanding as of a recent date, and on the balance sheet inside the filing. The weighted-average counts used for basic and diluted EPS appear on the income statement. All are free to read on SEC EDGAR, and the cover-page figure is usually the most current.',
      },
    ],
    body: `<p>The number of shares a company has outstanding looks like a static fact and behaves like a moving one. At a large listed company it changes every quarter, sometimes materially, and almost every figure investors rely on is divided by it.</p>
<p>Apple ended fiscal 2025 with 343.5 million fewer shares than it started with. Nothing about the business required that, no product was involved, and yet it altered earnings per share, dividends per share, book value per share and free cash flow per share simultaneously.</p>
<p>Understanding what moves this number, and in which direction, explains a good deal of what otherwise looks like performance.</p>
<h2>Four Counts, Often Confused</h2>
<p><strong>Issued shares</strong> are every share the company has ever created. <strong>Treasury shares</strong> are those it has bought back and holds itself. <strong>Outstanding shares</strong> are issued minus treasury: the shares currently in investors' hands. <strong>Float</strong> is narrower again, being the outstanding shares actually available to trade.</p>
<p>Treasury stock is the one most often misunderstood. Those shares still exist as legal instruments, but while the company holds them they have no vote, receive no dividend, and are excluded from every per-share calculation. A company can retire them permanently or keep them to satisfy future option exercises.</p>
<p>Float matters for a different reason. A company with 500 million shares outstanding but only 100 million genuinely trading behaves like a much smaller stock: spreads are wider, and a given order moves the price further, because it represents a larger share of what is available.</p>
<p>Low float is a structural driver of volatility rather than a sign of anything about the business.</p>
<h2>What Apple's Count Did in a Year</h2>
<p>From the balance sheet and income statement in Apple's <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm" target="_blank" rel="noopener noreferrer nofollow">Q4 FY2025 Form 8-K</a>:</p>
<div class="table-scroll"><table><thead><tr><th>Apple share counts (thousands)</th><th>FY2025</th><th>FY2024</th><th>Change</th></tr></thead><tbody><tr><td>Shares outstanding at year end</td><td>14,773,260</td><td>15,116,786</td><td>&minus;2.27%</td></tr><tr><td>Basic weighted-average shares</td><td>14,948,500</td><td>15,343,783</td><td>&minus;2.58%</td></tr><tr><td>Diluted weighted-average shares</td><td>15,004,697</td><td>15,408,095</td><td>&minus;2.62%</td></tr><tr><td>Spent on repurchases</td><td>$90,711M</td><td>$94,949M</td><td>&minus;4.5%</td></tr></tbody></table></div>
<h3>What the buyback removed</h3>
<p>Apple spent $90.7 billion buying its own stock during the year, and the outstanding count fell by 343.5 million shares. That is the net movement, not the gross number repurchased, because a second force was pushing the other way throughout.</p>
<h3>What equity compensation added back</h3>
<p>Restricted stock units vest continuously and become ordinary shares. Every one issued to an employee slightly reduces every existing holder's proportional claim. The gap between Apple's basic count of 14,948,500 thousand and its diluted count of 15,004,697 thousand — 56.2 million shares, about 0.4% — represents awards granted and not yet converted.</p>
<p>The prior year shows the same shape: a basic count of 15,343,783 thousand against a diluted 15,408,095 thousand in the <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm" target="_blank" rel="noopener noreferrer nofollow">fiscal 2024 filing</a>, a gap of 64.3 million shares. Dilution at Apple runs at a steady fraction of a percent a year rather than in bursts.</p>
<p>At Apple's scale that is modest relative to the repurchase. At many smaller technology companies the two roughly cancel: large sums are spent on buybacks, the share count stays flat, and what looks like capital return is in substance paying for compensation already granted.</p>
<div class="callout callout-info"><p>To see which is happening, compare the money spent on repurchases with the actual change in shares outstanding. If a company spends heavily and the count barely moves, the program is offsetting equity compensation rather than concentrating your ownership.</p></div>
<h2>Why the Balance Sheet and the Income Statement Disagree</h2>
<p>Apple's balance sheet says 14,773,260 thousand shares at year end. Its income statement uses 14,948,500 thousand to calculate basic EPS. Both are correct, and the difference is not an error.</p>
<p>Earnings accumulate across twelve months, so the denominator has to reflect how many shares existed across those twelve months rather than on the final day. The weighted average does exactly that. Because Apple's count was falling all year, the average sits above the year-end figure.</p>
<p>The arithmetic is checkable. The midpoint of the opening count of 15,116,786 and the closing count of 14,773,260 is 14,945,023, which lands within 0.02% of the reported basic weighted average of 14,948,500. That closeness tells you the repurchases ran fairly evenly through the year rather than being concentrated at one end — a small detail, read straight off two disclosed numbers.</p>
<h2>The Denominator Under Everything</h2>
<p>The share count is not one metric among many. It sits beneath most of them:</p>
<div class="table-scroll"><table><thead><tr><th>Metric</th><th>Calculation</th><th>Effect of a 2.3% smaller count</th></tr></thead><tbody><tr><td>Earnings per share</td><td>Net income &divide; shares</td><td>Rises ~2.3% with no change in profit</td></tr><tr><td>Dividend per share</td><td>Total dividends &divide; shares</td><td>Can rise while total cash paid is flat</td></tr><tr><td>Book value per share</td><td>Equity &divide; shares</td><td>Rises, though equity itself falls by the cash spent</td></tr><tr><td>Free cash flow per share</td><td>FCF &divide; shares</td><td>Rises with no change in cash generated</td></tr></tbody></table></div>
<p>This is why <a href="/stocks/eps-explained">EPS growth</a> should always be read against net income growth, and why a rising dividend per share does not by itself prove a company is distributing more cash. The <a href="/stocks/dividend-yield-explained">dividend yield</a> and every valuation multiple inherit the same dependency.</p>
<h2>Splits: The Count Changes and Nothing Else Does</h2>
<p>A stock split multiplies the share count without altering the company at all. Apple has done it twice recently: <strong>7-for-1 on June 9, 2014</strong>, and <strong>4-for-1 on August 31, 2020</strong>, when holders of record received three additional shares for each one held.</p>
<p>The morning after a 4-for-1 split, an investor holds four times as many shares at roughly a quarter of the price. Their stake is worth what it was worth the night before. The company has the same assets, the same revenue and the same profit.</p>
<h3>Why every per-share figure moves anyway</h3>
<p>Because the denominator quadrupled, earnings per share divides by four, as do dividend per share and book value per share. Historical figures are restated so charts remain continuous, so Apple's pre-2020 EPS appears in filings at a quarter of what was originally reported.</p>
<p>This is the cleanest available demonstration that per-share figures are arithmetic rather than substance. Nothing happened to Apple on August 31, 2020, and every per-share number in its accounts changed by 75%. A reverse split runs the same logic backwards, consolidating shares to lift the price, and is most often used by companies at risk of falling below an exchange's minimum price requirement, which makes it a signal worth investigating rather than ignoring.</p>
<h3>How to tell a split from a buyback in the data</h3>
<p>Both change the count, and they are easy to confuse in a chart. A split changes it in one step, by an exact multiple, with no cash leaving the company. A buyback reduces it gradually and consumes cash, which appears on the cash flow statement as repurchases of common stock.</p>
<p>If the count moved and the cash flow statement shows nothing, it was a split.</p>
<h2>When Shrinking the Count Is the Wrong Move</h2>
<p>A buyback is an investment by the company in its own shares, and like any investment it can be made at a bad price. Repurchasing below intrinsic value transfers wealth to continuing holders; repurchasing above it does the reverse. The per-share figures improve either way, which is precisely what makes the practice easy to misjudge.</p>
<p>Three patterns deserve skepticism. Buybacks funded by new borrowing exchange a permanent obligation for an optical gain. Buybacks running at their heaviest when the share price is at a high, and pausing during declines, indicate a program driven by available cash rather than by value. And buybacks continuing while <a href="/stocks/free-cash-flow-explained">free cash flow</a> falls mean the balance sheet is funding them.</p>
<p>The practice is enormous in aggregate. A record <a href="https://www.spglobal.com/spdji/en/corporate-news/article/sp-500-q1-2025-buybacks-set-quarterly-record-at-293-billion-up-206-helping-eps-growth" target="_blank" rel="noopener noreferrer nofollow">$293.5 billion</a> went into S&amp;P 500 repurchases in the first quarter of 2025, spread across 384 index members each buying back at least $5 million (S&amp;P Dow Jones Indices, 2025). Share counts across the market are shrinking, and part of what is reported as earnings growth is that shrinkage.</p>
<div class="callout callout-tip"><p>Chart shares outstanding over five to ten years alongside the share price. A count falling steadily while the price rises suggests disciplined capital return. A count that fell only during expensive years, or one that rose despite large repurchase spending, tells a different story about how management allocates money.</p></div>
<h2>Finding the Real Number</h2>
<p>Three places in any filing, each answering a slightly different question. The <strong>cover page</strong> of a Form 10-Q or 10-K states shares outstanding as of a date shortly before filing, and is the most current figure available. Every filing is searchable by company on <a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany" target="_blank" rel="noopener noreferrer nofollow">SEC EDGAR</a> at no cost. The <strong>balance sheet</strong> gives issued and outstanding counts at the period end. The <strong>income statement</strong> gives the basic and diluted weighted averages actually used for EPS.</p>
<p>Financial summary sites often show one of these without saying which, and the differences run to hundreds of millions of shares at a company Apple's size. When the number matters, take it from the filing.</p>
<p>Two further figures repay knowing where to find. <strong>Short interest</strong>, the number of shares sold short, is published by the exchanges twice monthly and is usually quoted as a percentage of float rather than of shares outstanding, so the same position can be described as 3% or 12% depending on which denominator the writer used. <strong>Authorised shares</strong>, stated in the certificate of incorporation, cap how many the company may issue at all; the gap between authorised and issued is the headroom available for future issuance without a shareholder vote.</p>
<p>None of these is obscure, and none requires a subscription. They sit in documents the company is legally obliged to publish, which is the general point: the share count is one of the few numbers in investing where the authoritative source is free and the summary version is the unreliable one.</p>
<h2>The Bottom Line</h2>
<p>Outstanding shares are the quietest important number in a set of accounts. They move constantly, they move for reasons unrelated to trading performance, and they change every per-share figure the market watches.</p>
<p>Apple's 2.27% reduction was a deliberate capital allocation decision that made its per-share results look better than its business alone would have. That is neither deceptive nor unusual. It only becomes a problem when a reader mistakes the arithmetic for the achievement, and the way to avoid that is to check the count alongside every per-share figure that depends on it.</p>
<p>For what sits on top of this denominator, see <a href="/stocks/eps-explained">earnings per share</a>; for the cash that funds repurchases, see <a href="/stocks/free-cash-flow-explained">free cash flow</a>.</p>`,
  },
  {
    slug: 'free-cash-flow-explained',
    title: 'Free Cash Flow: How It Is Calculated and Why It Diverges From Profit',
    seoTitle: 'Free Cash Flow (FCF): Formula, Calculation, and Real Examples',
    seoDescription:
      "How free cash flow is calculated from the cash flow statement, why Apple's profit rose 19.5% in a year its free cash flow fell 9.2%, and why the SEC treats FCF as a non-GAAP measure.",
    researchNote:
      "All Apple figures read directly off the cash flow statement and balance sheet in the Q4 FY2025 Form 8-K on SEC EDGAR: operating cash flow $111,482M vs $118,254M, capex $12,715M vs $9,447M, dividends paid $15,421M vs $15,234M, buybacks $90,711M vs $94,949M, shares outstanding 14,773,260 thousand vs 15,116,786 thousand, cash and marketable securities roughly $132.4B vs $156.7B. Free cash flow of $98,767M and $108,807M is operating cash flow less capex, computed here and stated as such. Derived rates (−9.2% FCF, −5.7% OCF, +34.6% capex, +19.5% net income, $13,243M net income above FCF, $106,132M returned against $98,767M generated) all recomputed from those filed figures. The non-GAAP treatment, the reconciliation requirement and the per-share prohibition come from SEC C&DI Question 102.07, verified against the SEC's own page.",
    citations: [APPLE_8K, APPLE_8K_FY24, SEC_NONGAAP, SPDJI_BUYBACKS],
    keyTakeaways: [
      'Free cash flow is operating cash flow minus capital expenditure: the cash a business generated after paying to maintain and expand itself.',
      'It is not a GAAP measure. There is no standard definition, and the SEC requires any company presenting it to explain its calculation and reconcile it.',
      "Apple generated $98.8 billion of free cash flow in fiscal 2025, down 9.2%, in the same year reported net income rose 19.5% to $112.0 billion.",
      'Profit and cash diverge because net income carries non-cash items and accrual timing that never touch the bank account.',
      'Apple returned $106.1 billion to shareholders that year against $98.8 billion generated, funding the $7.4 billion gap from its cash reserves.',
      'Capital expenditure is the swing factor: Apple\'s rose 34.6% year over year, and that increase alone accounts for much of the decline in free cash flow.',
      'The SEC prohibits presenting free cash flow on a per-share basis, because it is a liquidity measure rather than a performance one.',
    ],
    faq: [
      {
        question: 'How is free cash flow calculated?',
        answer:
          'The standard calculation is cash generated by operating activities, taken straight from the cash flow statement, minus payments for property, plant and equipment. For Apple in fiscal 2025 that is $111,482 million less $12,715 million, giving $98,767 million. Both inputs are disclosed lines in the filing, so anyone can reproduce the figure.',
      },
      {
        question: 'Why is free cash flow different from net income?',
        answer:
          'Net income is an accrual measure and includes items that never move cash: depreciation, stock-based compensation, and unrealised gains or losses on investments. It also books revenue when earned rather than when collected. Free cash flow tracks actual cash movement and subtracts capital spending, which net income spreads over many years as depreciation instead. The two answer different questions and routinely move in opposite directions.',
      },
      {
        question: 'Is free cash flow a GAAP measure?',
        answer:
          'No. The SEC treats it as a non-GAAP measure. Under Compliance and Disclosure Interpretation 102.07 the staff permits it, but because the measure has no uniform definition, a company presenting it must describe clearly how it was calculated and provide a reconciliation. It also cannot be shown on a per-share basis, since it is a liquidity rather than a performance measure.',
      },
      {
        question: 'Can a company pay out more than its free cash flow?',
        answer:
          'Yes, and large companies frequently do for a year or two. Apple returned $106.1 billion through dividends and buybacks in fiscal 2025 against $98.8 billion of free cash flow, covering the difference from its cash and securities holdings, which fell by roughly $24 billion over the year. A company with a large balance sheet can sustain that; one without cannot, and repeated years of it are a warning.',
      },
      {
        question: 'Does high capital spending mean weak free cash flow?',
        answer:
          'It reduces the current-year figure by definition, but that is not the same as weakness. Capex funds future capacity, so a company investing heavily may show depressed free cash flow precisely because it is building the thing that will generate cash later. The question worth asking is whether the spending is maintenance, simply keeping existing assets running, or genuine expansion.',
      },
      {
        question: 'What is free cash flow yield?',
        answer:
          'Free cash flow divided by market capitalization, expressed as a percentage. It answers how much cash the business generates relative to what the market is paying for it, and unlike the P/E ratio it is harder to distort with accounting choices. It is most useful compared against a company\'s own history and against direct competitors rather than as an absolute threshold.',
      },
    ],
    body: `<p>Free cash flow measures the cash a business actually generated after paying for the assets it needs to keep running. Take cash from operations, subtract what was spent on property, plant and equipment, and what remains is available for dividends, buybacks, debt repayment or acquisitions.</p>
<p>It is popular because it is harder to manipulate than profit. That reputation is mostly deserved, with two significant caveats: there is no standard definition of the measure, and it can be depressed by exactly the spending that makes a company more valuable. Apple's fiscal 2025 illustrates both, and does something more useful besides.</p>
<p>In a year its reported profit rose 19.5%, its free cash flow fell 9.2%.</p>
<h2>The Two Lines the Calculation Uses</h2>
<p><strong>Free cash flow = cash generated by operating activities &minus; payments for property, plant and equipment</strong></p>
<p>Both inputs sit on the cash flow statement, which is the third statement in any filing after the income statement and balance sheet. The first line is what the business collected and paid out in ordinary trading, after adjusting reported profit for non-cash items and working capital movements.</p>
<p>The second is capital expenditure: buildings, equipment, data centers, machinery.</p>
<p>The logic is that a company cannot distribute money it must spend to stay in business. Cash from operations alone overstates what is genuinely available, because a manufacturer that stops replacing machinery will show excellent operating cash flow for a few years and then collapse.</p>
<p>One consequence of that logic is worth stating plainly: free cash flow can be negative at a perfectly sound company. A retailer building stores, or a utility replacing infrastructure, may spend more on assets in a given year than trading produced. The figure only becomes alarming when it is persistently negative without the spending translating into growth, or when it is negative while the company continues distributing cash it has not earned.</p>
<h2>Operating Cash Flow Is Not Free Cash Flow</h2>
<p>These get used interchangeably and should not be. Operating cash flow is a GAAP line, presented identically by every filer, and it stops before any capital spending. Free cash flow subtracts that spending and is not a GAAP line at all.</p>
<p>The difference matters most in capital-intensive industries. A telecoms operator or a semiconductor manufacturer can post strong operating cash flow while free cash flow is thin or negative, because the capital needs of the business consume most of what trading generates.</p>
<p>Comparing a software company's operating cash flow with a chipmaker's, without subtracting capex, flatters the chipmaker considerably.</p>
<h2>Apple's Fiscal 2025: Profit Up, Cash Down</h2>
<p>Every figure below comes from the cash flow statement in Apple's <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm" target="_blank" rel="noopener noreferrer nofollow">Q4 FY2025 Form 8-K</a>.</p>
<div class="table-scroll"><table><thead><tr><th>Twelve months ended</th><th>Sep 27, 2025</th><th>Sep 28, 2024</th><th>Change</th></tr></thead><tbody><tr><td>Cash from operating activities</td><td>$111,482M</td><td>$118,254M</td><td>&minus;5.7%</td></tr><tr><td>Capital expenditure</td><td>$12,715M</td><td>$9,447M</td><td>+34.6%</td></tr><tr><td><strong>Free cash flow</strong></td><td><strong>$98,767M</strong></td><td><strong>$108,807M</strong></td><td><strong>&minus;9.2%</strong></td></tr><tr><td>Net income (for comparison)</td><td>$112,010M</td><td>$93,736M</td><td>+19.5%</td></tr></tbody></table></div>
<h3>Two lines moving the wrong way at once</h3>
<p>Operating cash flow fell 5.7%. Capital spending rose 34.6%, an increase of roughly $3.3 billion. Subtracting a bigger number from a smaller one produces the 9.2% decline, and neither movement is visible anywhere on the income statement.</p>
<h3>Why profit and cash pointed in opposite directions</h3>
<p>Reported net income rose 19.5%, to $112.0 billion. Free cash flow came in at $98.8 billion, meaning accounting profit exceeded cash generation by $13.2 billion.</p>
<p>Part of that gap is structural: net income spreads capital spending across years as depreciation, while free cash flow charges the whole payment in the year it happens. Part is the prior-year comparison. Apple's fiscal 2024 profit was reduced by a one-time <a href="https://www.sec.gov/Archives/edgar/data/320193/000032019324000120/a8-kex991q4202409282024.htm" target="_blank" rel="noopener noreferrer nofollow">$10.2 billion tax charge</a>, which flattered the following year's growth rate on the income statement without doing anything comparable to the cash statement. The 19.5% and the &minus;9.2% are both correct, and they are measuring different things.</p>
<div class="callout callout-info"><p>Where profit and free cash flow diverge for more than a couple of quarters, the reconciliation at the top of the cash flow statement names the reason. It lists every adjustment between net income and operating cash flow, line by line. It is the least-read part of a filing and often the most informative.</p></div>
<h2>The Year Apple Paid Out More Than It Generated</h2>
<p>Free cash flow is what funds returns to shareholders, so it is worth checking the two against each other. In fiscal 2025 Apple paid $15,421 million in dividends and spent $90,711 million repurchasing stock, a total of $106,132 million.</p>
<p>Against $98,767 million of free cash flow, that is $7,365 million more returned than generated. The gap came out of the balance sheet: cash and marketable securities fell from roughly $156.7 billion to $132.4 billion over the year.</p>
<div class="table-scroll"><table><thead><tr><th>Apple, fiscal year</th><th>2025</th><th>2024</th></tr></thead><tbody><tr><td>Free cash flow generated</td><td>$98,767M</td><td>$108,807M</td></tr><tr><td>Dividends paid</td><td>$15,421M</td><td>$15,234M</td></tr><tr><td>Share repurchases</td><td>$90,711M</td><td>$94,949M</td></tr><tr><td><strong>Total returned</strong></td><td><strong>$106,132M</strong></td><td><strong>$110,183M</strong></td></tr><tr><td>Returned above free cash flow</td><td>$7,365M</td><td>$1,376M</td></tr></tbody></table></div>
<p>The buyback line does most of the work in both years, and Apple is not unusual in that. S&amp;P 500 companies repurchased a record <a href="https://www.spglobal.com/spdji/en/corporate-news/article/sp-500-q1-2025-buybacks-set-quarterly-record-at-293-billion-up-206-helping-eps-growth" target="_blank" rel="noopener noreferrer nofollow">$293.5 billion</a> in a single quarter in early 2025, and $999.2 billion over the preceding twelve months (S&amp;P Dow Jones Indices, 2025). Buybacks are discretionary in a way dividends are not, and they are the first line to shrink when cash generation tightens. A company holding a dividend steady while quietly halving its repurchases is telling you something about free cash flow that its earnings release will not.</p>
<p>This is not a distress signal for a company holding well over $100 billion in liquid assets, and it was not a one-year anomaly either, since fiscal 2024 returns of $110.2 billion also exceeded that year's $108.8 billion of free cash flow. It is a deliberate drawdown of a cash pile Apple has said it intends to reduce. But the same arithmetic at a company without those reserves describes a payout that has to shrink.</p>
<div class="callout callout-tip"><p>Compare total shareholder returns with free cash flow over three to five years, not one. A single year of paying out more is a decision. Five consecutive years, at a company whose cash balance is falling and whose borrowings are rising, is a dividend being funded by the balance sheet rather than the business.</p></div>
<h2>Reading the Reconciliation at the Top of the Statement</h2>
<p>The cash flow statement does not begin with cash. It begins with net income and then adjusts it, line by line, until it arrives at cash from operations. That block of adjustments is where the difference between profit and cash is itemised, and it is the fastest way to understand any divergence.</p>
<p>Three categories account for most of it. <strong>Non-cash charges</strong> such as depreciation and amortisation are added back, because they reduced profit without moving money. <strong>Stock-based compensation</strong> is added back for the same reason, though the expense is genuine and is paid in stock that dilutes existing holders. <strong>Working capital movements</strong> can push in either direction: money tied up in inventory or owed by customers reduces cash without touching profit, while stretching payment to suppliers does the reverse.</p>
<p>A company whose profit is rising while receivables grow faster than sales is collecting less of what it books. That shows up in this reconciliation long before it reaches the income statement, which is the practical reason to read it.</p>
<h2>Nobody Agrees on How to Calculate It</h2>
<p>Free cash flow is a non-GAAP measure, which has a specific consequence: no accounting standard fixes its definition, and companies calculate it differently.</p>
<p>The common variations subtract only maintenance capex rather than total capex, or additionally subtract dividends, acquisitions, or lease payments. Each produces a different answer from the same filing. The SEC addresses this directly in <a href="https://www.sec.gov/corpfin/non-gaap-financial-measures" target="_blank" rel="noopener noreferrer nofollow">Compliance and Disclosure Interpretation 102.07</a>, which permits the measure but requires a company presenting it to describe clearly how the figure was calculated and to reconcile it to the GAAP line it came from.</p>
<p>Two further points from that guidance are worth carrying around. Companies must not imply free cash flow represents cash available for discretionary spending, because mandatory debt service and other non-discretionary payments are not deducted from it. And it cannot be presented on a per-share basis at all, since the SEC classifies it as a liquidity measure rather than a performance measure.</p>
<h2>What the Number Gets Used For</h2>
<h3>Dividend and buyback coverage</h3>
<p>The most direct use. Divide free cash flow by total dividends paid: below 1.0 means the payout is not covered by the cash the business generated that year. This is the check that separates a <a href="/stocks/dividend-yield-explained">high dividend yield</a> that reflects a healthy business from one that reflects a payout about to be cut.</p>
<h3>Free cash flow yield</h3>
<p>Free cash flow divided by market capitalization. It answers the same question as the <a href="/stocks/price-to-earnings-ratio-explained">P/E ratio</a> from the cash side, and it is harder to distort, because the accounting choices that move reported earnings mostly do not move cash. As with any multiple, it is comparable within a sector and misleading across sectors.</p>
<h2>Where the Measure Misleads</h2>
<ul>
<li><strong>Growth investment looks like weakness.</strong> A company building capacity shows depressed free cash flow in exactly the years it is creating future value. The measure cannot distinguish that from decline.</li>
<li><strong>Cutting capex flatters it immediately.</strong> Deferring necessary maintenance raises free cash flow this year and damages the business later, and the current-year number looks better for it.</li>
<li><strong>Working capital swings distort single periods.</strong> Collecting receivables faster or paying suppliers slower boosts operating cash flow without anything improving.</li>
<li><strong>It ignores debt obligations.</strong> The SEC's specific warning: mandatory repayments are not deducted, so the figure overstates genuinely discretionary cash at an indebted company.</li>
<li><strong>Definitions vary between companies.</strong> Two firms reporting free cash flow may have calculated it differently, so a like-for-like comparison means recomputing both from their cash flow statements.</li>
</ul>
<h2>The Bottom Line</h2>
<p>Free cash flow answers a question the income statement cannot: how much cash did this business actually produce after paying to sustain itself. That makes it the right check on whether a dividend is affordable, whether buybacks are funded, and whether reported profit is turning into anything real.</p>
<p>It is not a purer version of profit. It swings on capital spending decisions, it can be improved by neglect, and it lacks a standard definition, so the sensible habit is to compute it yourself from the two disclosed lines rather than trusting a summary figure. Apple's fiscal year makes the case for reading both: a 19.5% rise in profit and a 9.2% fall in cash generation, in the same twelve months, from the same filing.</p>
<p>For the profit figure it is checked against, see <a href="/stocks/net-income-explained">net income explained</a>; for what the cash funded, see <a href="/stocks/outstanding-shares-explained">outstanding shares</a>.</p>`,
  },
];
