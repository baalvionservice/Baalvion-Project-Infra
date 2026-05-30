/* Seed community debates + asset sentiment. meta = full frontend DebateNode / AssetSentiment.
   Idempotent (debates by ref, sentiment by ticker). Run with inline DB env. */
const db = require('../models');

const arg = (id, user, role, reputation, content, likes) =>
  ({ id, user, avatar: `https://picsum.photos/seed/${encodeURIComponent(user)}/64/64`, role, reputation, content, likes, replies: Math.floor(likes / 8), timestamp: new Date(Date.now() - likes * 6e5).toISOString() });

const DEBATES = [
  {
    id: 'dbt-nvda', topic: 'Is NVIDIA still a buy above $130?', asset: 'NVDA', category: 'Stocks',
    bull_participants: 412, bear_participants: 268, comments: 1840, views: 52100, status: 'Active',
    summary: 'Bulls cite the AI capex supercycle and CUDA moat; bears flag a 50x forward multiple and customer concentration.',
    bull_arguments: [arg('a1', 'Michael Roberts', 'Senior Analyst', 92, 'Data-center revenue is still compounding triple digits; the install base + CUDA lock-in is a durable moat.', 142), arg('a2', 'Lisa Tran', 'Tech Reporter', 81, 'Every hyperscaler raised capex guidance this quarter — demand visibility into next year is excellent.', 98)],
    bear_arguments: [arg('b1', 'Derek Howell', 'Portfolio Manager', 88, 'At 50x forward earnings the bar is extreme; any capex digestion pause and the stock de-rates hard.', 121), arg('b2', 'Fiona Blake', 'Rates Strategist', 79, 'Customer concentration is real — a handful of buyers drive most of the upside.', 64)],
    timeline: [{ timestamp: new Date(Date.now() - 864e5).toISOString(), event: 'Debate opened', type: 'start' }, { timestamp: new Date(Date.now() - 36e5).toISOString(), event: 'Bull case crossed 400 votes', type: 'vote' }],
    community_votes: { bull: 412, bear: 268, neutral: 73 },
  },
  {
    id: 'dbt-btc', topic: 'Bitcoin to $150k this cycle — realistic?', asset: 'BTC', category: 'Cryptocurrency',
    bull_participants: 651, bear_participants: 233, comments: 2410, views: 71400, status: 'Active',
    summary: 'ETF inflows and a tightening float vs. macro/liquidity risk and prior-cycle drawdowns.',
    bull_arguments: [arg('a1', 'Priya Sharma', 'Crypto Editor', 90, 'Spot-ETF flows are structurally new demand against a shrinking liquid supply — the squeeze is real.', 188), arg('a2', 'Carlos Mendes', 'Head of Research', 85, 'Long-term holders are accumulating, not distributing into strength.', 130)],
    bear_arguments: [arg('b1', 'Nora Walsh', 'Commodities', 77, 'Every cycle feels different until the 60% drawdown arrives. Respect the volatility.', 96)],
    timeline: [{ timestamp: new Date(Date.now() - 1728e5).toISOString(), event: 'Debate opened', type: 'start' }],
    community_votes: { bull: 651, bear: 233, neutral: 118 },
  },
  {
    id: 'dbt-fed', topic: 'Will the Fed cut twice before year-end?', asset: null, category: 'Macro',
    bull_participants: 188, bear_participants: 204, comments: 990, views: 28800, status: 'Active',
    summary: 'Cooling CPI and a softening labor market vs. sticky core services inflation.',
    bull_arguments: [arg('a1', 'Rachel Kim', 'Economics', 86, 'Disinflation is broadening; two cuts is the path of least resistance if jobs soften.', 74)],
    bear_arguments: [arg('b1', 'David Chen', 'Fixed Income', 80, 'Core services are sticky and financial conditions are loose — the Fed has no urgency.', 88)],
    timeline: [{ timestamp: new Date(Date.now() - 432e5).toISOString(), event: 'Debate opened', type: 'start' }],
    community_votes: { bull: 188, bear: 204, neutral: 51 },
  },
];

const histKey = () => Array.from({ length: 7 }).map((_, i) => ({ date: new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10) }));
const sentiment = (ticker, name, bullish, bearish, trend) => {
  const votes = bullish + bearish;
  return { id: `snt-${ticker.toLowerCase()}`, name, ticker, bullish, bearish, votes, trend, history: histKey().map((h, i) => ({ ...h, bullish: Math.max(40, Math.min(95, bullish - 6 + i * 2)) })) };
};

const SENTIMENTS = [
  sentiment('NVDA', 'NVIDIA', 78, 22, 'Up'),
  sentiment('BTC', 'Bitcoin', 84, 16, 'Up'),
  sentiment('TSLA', 'Tesla', 49, 51, 'Down'),
  sentiment('AAPL', 'Apple', 61, 39, 'Stable'),
  sentiment('ETH', 'Ethereum', 72, 28, 'Up'),
  sentiment('SPX', 'S&P 500', 66, 34, 'Up'),
];

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let d = 0, s = 0;
  for (const node of DEBATES) {
    const base = { ref: node.id, topic: node.topic, category: node.category, status: node.status, meta: node };
    const [row, created] = await db.CommunityDebate.findOrCreate({ where: { ref: node.id }, defaults: base });
    if (!created) await row.update(base);
    d++;
  }
  for (const sen of SENTIMENTS) {
    const base = { ticker: sen.ticker, name: sen.name, meta: sen };
    const [row, created] = await db.AssetSentiment.findOrCreate({ where: { ticker: sen.ticker }, defaults: base });
    if (!created) await row.update(base);
    s++;
  }
  console.log(JSON.stringify({ ok: true, debates: d, sentiments: s }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
