/* Batch-seed published CMS content for the Imperialpedia website: create via the real API
   then publish via the workflow transition. Idempotent (existing slugs 409 → skipped).
   Usage: node scripts/_seedCmsBatch.cjs <websiteId> */
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const websiteId = process.argv[2];
if (!websiteId) { console.error('usage: node _seedCmsBatch.cjs <websiteId>'); process.exit(1); }
const privateKey = fs.readFileSync(path.resolve(__dirname, '../../../identity/.keys/jwt_private.pem'), 'utf8');
const token = jwt.sign(
  { sub: '67', org_id: '52c76e5c-0668-4492-ba20-23e7ee16f49b', sid: 'cms-batch-sid', jti: crypto.randomUUID(), roles: ['super_admin'], permissions: [] },
  privateKey,
  { algorithm: 'RS256', keyid: 'IZVFqgw_bfdxUk8R', issuer: 'baalvion-auth', audience: 'baalvion-platform', expiresIn: '20m' },
);

const blocks = (lead, h1, p1, h2, p2, takeaway) => [
  { id: 'b0', type: 'paragraph', order: 0, content: { text: lead } },
  { id: 'b1', type: 'heading', order: 1, content: { text: h1, level: 2 } },
  { id: 'b2', type: 'paragraph', order: 2, content: { text: p1 } },
  { id: 'b3', type: 'heading', order: 3, content: { text: h2, level: 2 } },
  { id: 'b4', type: 'paragraph', order: 4, content: { text: p2 } },
  { id: 'b5', type: 'callout', order: 5, content: { text: takeaway, variant: 'info' } },
];

const A = (type, title, slug, category, excerpt, lead, h1, p1, h2, p2, takeaway) => ({
  type, title, slug, category, excerpt,
  blocks: blocks(lead, h1, p1, h2, p2, takeaway),
});

const ITEMS = [
  A('article', 'How to Build a Diversified Portfolio in 2026', 'build-diversified-portfolio-2026', 'Investing', 'A practical framework for spreading risk across asset classes, sectors, and geographies.', 'Diversification remains the closest thing to a free lunch in investing.', 'Why diversification works', 'Combining assets that do not move in lockstep smooths returns and reduces the odds of a catastrophic drawdown.', 'A simple model portfolio', 'A common starting point is a globally diversified mix of equities and bonds, tilted to your time horizon and risk tolerance.', 'Rebalance once or twice a year — not every time the market wobbles.'),
  A('article', 'Understanding Index Funds and ETFs', 'understanding-index-funds-etfs', 'Investing', 'Low-cost, passive vehicles that have reshaped how people invest.', 'Index funds track a benchmark instead of trying to beat it.', 'Funds vs. ETFs', 'Both can track the same index; ETFs trade intraday like stocks while mutual funds price once a day.', 'Why costs matter', 'Over decades, a 0.5% fee difference can cost you tens of thousands of dollars in compounded returns.', 'For most investors, a low-cost total-market index fund is a sensible core holding.'),
  A('article', 'Dollar-Cost Averaging Explained', 'dollar-cost-averaging-explained', 'Investing', 'Investing fixed amounts on a schedule to reduce timing risk.', 'DCA means investing a set amount at regular intervals regardless of price.', 'The behavioral edge', 'Automating contributions removes the temptation to time the market and smooths your average entry price.', 'When lump-sum wins', 'Historically, lump-sum investing beats DCA on average — but DCA is easier to stick with emotionally.', 'The best strategy is the one you will actually follow consistently.'),
  A('article', 'A Beginner Guide to Bonds', 'beginner-guide-to-bonds', 'Bonds', 'How fixed-income works and where it fits in a portfolio.', 'A bond is a loan you make to a government or company in exchange for interest.', 'Yields and prices', 'Bond prices move inversely to interest rates — when rates rise, existing bond prices fall.', 'Duration and risk', 'Longer-duration bonds are more sensitive to rate changes; short-duration bonds are steadier.', 'Bonds cushion a portfolio when equities sell off — that is their job.'),
  A('article', 'What Drives Inflation?', 'what-drives-inflation', 'Economics', 'The forces behind rising prices and why they matter for your money.', 'Inflation is the rate at which the general price level rises over time.', 'Demand vs. supply', 'Inflation can come from too much demand chasing too few goods, or from supply shocks like energy spikes.', 'Why the Fed cares', 'Central banks raise rates to cool demand when inflation runs above their target.', 'Real returns — after inflation — are what actually build wealth.'),
  A('article', 'The Power of Compound Growth', 'the-power-of-compound-growth', 'Investing', 'Why starting early is the single biggest lever in wealth building.', 'Compounding is interest earning interest on itself over time.', 'Time beats timing', 'A modest sum invested early can outgrow a much larger sum invested late, thanks to compounding.', 'The cost of waiting', 'Every year you delay investing is a year of compounding you can never get back.', 'Start early, stay invested, and let time do the heavy lifting.'),
  A('article', 'How Credit Scores Actually Work', 'how-credit-scores-work', 'Personal Finance', 'The factors behind your score and how to improve it.', 'Your credit score is a snapshot of how reliably you repay debt.', 'The five factors', 'Payment history and credit utilization together drive most of your score.', 'Quick wins', 'Paying down balances and never missing a payment are the fastest ways to improve your score.', 'Keep utilization below 30% — ideally under 10%.'),
  A('article', 'Roth vs. Traditional Retirement Accounts', 'roth-vs-traditional-retirement', 'Retirement', 'Choosing between tax-now and tax-later retirement savings.', 'The core difference is when you pay taxes on the money.', 'Roth basics', 'You contribute after-tax dollars and withdraw tax-free in retirement.', 'Traditional basics', 'You contribute pre-tax dollars now and pay taxes on withdrawals later.', 'If you expect higher taxes in retirement, a Roth often wins.'),
  A('article', 'Emergency Funds: How Much Is Enough?', 'emergency-funds-how-much', 'Personal Finance', 'Building the financial buffer that keeps a setback from becoming a crisis.', 'An emergency fund is cash set aside for unexpected expenses.', 'The rule of thumb', 'Most planners suggest three to six months of essential expenses.', 'Where to keep it', 'A high-yield savings account keeps it liquid while earning meaningful interest.', 'Build a starter fund first, then grow it while investing for the long term.'),
  A('article', 'Reading a Company Balance Sheet', 'reading-a-balance-sheet', 'Investing', 'The fundamentals of evaluating a company financial health.', 'A balance sheet shows what a company owns and owes at a point in time.', 'Assets vs. liabilities', 'Healthy companies grow assets faster than liabilities and carry manageable debt.', 'Key ratios', 'The current ratio and debt-to-equity ratio reveal liquidity and leverage at a glance.', 'Numbers tell a story — learn to read it before you invest.'),
  A('article', 'Real Estate vs. Stocks: Which Builds More Wealth?', 'real-estate-vs-stocks', 'Real Estate', 'Comparing two of the most popular long-term wealth builders.', 'Both real estate and stocks have created enormous wealth — through different mechanisms.', 'The case for stocks', 'Stocks are liquid, low-maintenance, and historically deliver strong long-run returns.', 'The case for real estate', 'Property offers leverage, income, and tax advantages, but demands time and capital.', 'Most wealthy households own both — diversification across asset types matters.'),
  A('article', 'Decoding the Yield Curve', 'decoding-the-yield-curve', 'Markets', 'What the shape of the yield curve says about the economy.', 'The yield curve plots interest rates across bond maturities.', 'Normal vs. inverted', 'An inverted curve — short rates above long rates — has historically preceded recessions.', 'Why it matters', 'It reflects the market collective expectation for growth and rate cuts.', 'No single indicator is destiny, but the curve is worth watching.'),
  A('article', 'Crypto Custody: Keeping Your Coins Safe', 'crypto-custody-safety', 'Crypto', 'Self-custody, exchanges, and the tradeoffs of each.', 'Custody is about who controls the private keys to your crypto.', 'Not your keys...', 'Holding coins on an exchange means trusting that exchange with your assets.', 'Hardware wallets', 'A hardware wallet keeps keys offline and is the gold standard for self-custody.', 'For meaningful sums, learn self-custody — but back up your seed phrase securely.'),
  A('article', 'Tax-Loss Harvesting Basics', 'tax-loss-harvesting-basics', 'Personal Finance', 'Turning investment losses into a tax advantage.', 'Tax-loss harvesting means selling losers to offset taxable gains.', 'How it works', 'Realized losses offset realized gains, reducing your tax bill.', 'Watch the wash sale rule', 'Buying a substantially identical security within 30 days disallows the loss.', 'Harvest thoughtfully — do not let the tax tail wag the investment dog.'),
  A('article', 'Dividend Investing for Income', 'dividend-investing-for-income', 'Investing', 'Building a portfolio that pays you to hold it.', 'Dividends are cash payments companies make to shareholders.', 'Yield vs. growth', 'High current yield is nice, but dividend growth compounds income over time.', 'Quality matters', 'Sustainable payout ratios and strong cash flow signal a reliable dividend.', 'Reinvested dividends are a major driver of long-run total returns.'),
  A('article', 'Mortgages 101: Fixed vs. Adjustable', 'mortgages-fixed-vs-adjustable', 'Real Estate', 'Choosing the right home loan structure for your situation.', 'A mortgage is a long-term loan secured by your home.', 'Fixed-rate', 'Your rate and payment stay the same for the life of the loan — predictable and safe.', 'Adjustable-rate', 'ARMs start lower but can rise; they suit shorter holding periods.', 'Match the loan to how long you plan to stay in the home.'),
  A('news', 'Markets Rally as Inflation Data Cools', 'markets-rally-inflation-cools', 'Markets', 'Equities climbed after the latest CPI print came in below expectations.', 'Stocks rallied broadly on Wednesday after fresh data showed inflation easing.', 'What moved', 'The S&P 500 and Nasdaq both advanced as bond yields eased.', 'What it means', 'Cooler inflation strengthens the case for rate cuts later this year.', 'Markets now price in two cuts before year-end.'),
  A('news', 'Bitcoin Tops $95,000 on ETF Inflows', 'bitcoin-tops-95k-etf-inflows', 'Crypto', 'Renewed institutional demand pushed the largest cryptocurrency higher.', 'Bitcoin surged past $95,000 as spot ETFs logged their biggest inflows in months.', 'The driver', 'Long-term holders are accumulating while ETF demand tightens supply.', 'The risk', 'Volatility remains elevated; sharp pullbacks are part of the territory.', 'On-chain signals remain constructive for now.'),
  A('news', 'Fed Holds Rates Steady Again', 'fed-holds-rates-steady-again', 'Economics', 'The central bank kept its benchmark rate unchanged for a fourth meeting.', 'The Federal Reserve held rates steady, citing progress on inflation.', 'Powell speaks', 'The chair struck a measured tone, emphasizing data dependence.', 'The path ahead', 'Markets expect the first cut in the second half of the year.', 'The next CPI report will be pivotal.'),
  A('news', 'Gold Hits Record High Above $2,400', 'gold-record-high-2400', 'Markets', 'Safe-haven demand and central-bank buying lifted gold to new highs.', 'Gold crossed $2,400 an ounce for the first time on safe-haven flows.', 'Why now', 'Central-bank purchases and a softer dollar are persistent tailwinds.', 'Outlook', 'Analysts see $2,500 in play if the trend holds.', 'Gold has been one of the best-performing assets this year.'),
  A('news', 'Tech Earnings Beat Across the Board', 'tech-earnings-beat', 'Stocks', 'A wave of strong results from large-cap tech lifted sentiment.', 'Major technology companies reported better-than-expected earnings.', 'AI spend', 'Cloud providers raised capital-expenditure guidance on AI demand.', 'Caution', 'Some strategists warn valuations leave little room for error.', 'Breadth of the rally is a healthy sign.'),
  A('news', 'Housing Starts Slow as Rates Tick Up', 'housing-starts-slow', 'Real Estate', 'Higher mortgage rates weighed on new construction last month.', 'Housing starts slowed as mortgage rates climbed back above 7%.', 'Affordability', 'Buyers are squeezed by both prices and financing costs.', 'Inventory', 'Supply remains below pre-pandemic norms despite the slowdown.', 'Rate relief would be the biggest catalyst for the market.'),
];

function req(method, p, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      { host: '127.0.0.1', port: 3018, path: p, method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } },
      (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, json: j }); }); },
    );
    r.on('error', () => resolve({ status: 0, json: null }));
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  let created = 0, published = 0, skipped = 0;
  for (const it of ITEMS) {
    const body = { title: it.title, slug: it.slug, contentType: it.type, excerpt: it.excerpt,
      featuredImage: `https://picsum.photos/seed/${it.slug}/1200/675`, contentBlocks: it.blocks,
      seoMetadata: { title: it.title, description: it.excerpt } };
    const c = await req('POST', `/api/v1/cms/websites/${websiteId}/content`, body);
    if (c.status === 201 && c.json?.data?.id) {
      created++;
      const pub = await req('POST', `/api/v1/cms/websites/${websiteId}/content/${c.json.data.id}/workflow/transition`, { action: 'publish' });
      if (pub.status === 200) published++;
    } else if (c.status === 409) { skipped++; }
  }
  const out = JSON.stringify({ ok: true, total: ITEMS.length, created, published, skipped });
  fs.writeFileSync(path.join(__dirname, '_seed_cms_batch_out.txt'), out);
  console.log(out);
})();
