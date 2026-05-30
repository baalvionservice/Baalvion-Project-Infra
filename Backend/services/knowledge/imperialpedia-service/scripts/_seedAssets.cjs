/* Seed imperialpedia.asset_summaries with market data (stocks/crypto/commodities/index/etf).
   Idempotent (upsert by symbol). Run with inline DB env. */
const db = require('../models');

const A = (symbol, name, asset_type, exchange, current_price, change_pct_24h, market_cap, sentiment, ai_summary, key_metrics) =>
  ({ symbol, name, asset_type, exchange, current_price, change_pct_24h, market_cap, volume_24h: market_cap ? market_cap * 0.02 : null, sentiment, ai_summary, key_metrics, last_updated_at: new Date() });

const ASSETS = [
  A('NVDA', 'NVIDIA Corp', 'stock', 'NASDAQ', 132.41, 2.8, 3250000000000, 'bullish', 'AI demand keeps data-center revenue compounding; valuation rich but momentum intact.', { pe: 52, sector: 'Semiconductors' }),
  A('AAPL', 'Apple Inc', 'stock', 'NASDAQ', 228.13, 0.6, 3450000000000, 'neutral', 'Services growth offsets soft hardware cycle; steady cash returns.', { pe: 34, sector: 'Consumer Electronics' }),
  A('MSFT', 'Microsoft Corp', 'stock', 'NASDAQ', 442.57, 1.1, 3290000000000, 'bullish', 'Azure + Copilot driving enterprise AI monetization.', { pe: 37, sector: 'Cloud' }),
  A('TSLA', 'Tesla Inc', 'stock', 'NASDAQ', 248.5, -1.9, 790000000000, 'neutral', 'Margins pressured by price cuts; autonomy optionality remains the bull case.', { pe: 64, sector: 'Auto/EV' }),
  A('AMZN', 'Amazon.com Inc', 'stock', 'NASDAQ', 186.2, 0.9, 1940000000000, 'bullish', 'AWS reacceleration and ads strength lift operating leverage.', { pe: 41, sector: 'E-commerce/Cloud' }),
  A('BTC', 'Bitcoin', 'crypto', 'CRYPTO', 95780.0, 8.4, 1880000000000, 'bullish', 'Record ETF inflows + long-term-holder accumulation tighten float.', { dominance: '54%' }),
  A('ETH', 'Ethereum', 'crypto', 'CRYPTO', 3620.0, 5.9, 435000000000, 'bullish', 'Staking yield + L2 activity underpin demand; ETF flows building.', { gas_gwei: 18 }),
  A('SOL', 'Solana', 'crypto', 'CRYPTO', 198.4, 11.2, 92000000000, 'bullish', 'High throughput and DeFi/meme activity drive on-chain volume.', { tps: 2800 }),
  A('XAU', 'Gold (Spot)', 'commodity', 'COMEX', 2404.0, 1.7, null, 'bullish', 'Central-bank buying and a softer dollar push gold to fresh highs.', { unit: 'per oz' }),
  A('WTI', 'Crude Oil (WTI)', 'commodity', 'NYMEX', 78.9, -0.3, null, 'neutral', 'Supply discipline vs. demand worries keep prices range-bound.', { unit: 'per bbl' }),
  A('SPX', 'S&P 500 Index', 'index', 'INDEX', 5842.0, 0.4, null, 'bullish', 'Broad earnings beats lift the index to a record close.', { ytd: '+14%' }),
  A('SPY', 'SPDR S&P 500 ETF', 'etf', 'NYSEARCA', 583.1, 0.4, 560000000000, 'bullish', 'Tracks the S&P 500; the default core US equity exposure.', { expense_ratio: '0.09%' }),
];

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (const a of ASSETS) {
    const [row, created] = await db.AssetSummary.findOrCreate({ where: { symbol: a.symbol }, defaults: a });
    if (!created) await row.update(a);
    n++;
  }
  console.log(JSON.stringify({ ok: true, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
