/* Seed a demo watchlist + portfolio for the super-admin (user_id 67) so a fresh login shows
   real, live-priced data. Idempotent (upsert by user_id+symbol). Run with inline DB env. */
const db = require('../models');

const USER = Number(process.argv[2] || 67);
const WATCH = ['NVDA', 'BTC', 'AAPL', 'ETH', 'TSLA', 'SPY', 'AMZN'];
// [symbol, quantity, avg_cost] — costs chosen vs the seeded live prices to show gains & losses.
const HOLDINGS = [
  ['NVDA', 12, 110.0],
  ['AAPL', 30, 195.0],
  ['MSFT', 8, 400.0],
  ['TSLA', 15, 290.0],
  ['BTC', 0.4, 72000.0],
  ['ETH', 6, 3100.0],
];

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let w = 0, h = 0;
  for (const symbol of WATCH) {
    const [, created] = await db.WatchlistItem.findOrCreate({ where: { user_id: USER, symbol }, defaults: { user_id: USER, symbol, group_name: 'My Watchlist' } });
    w += created ? 1 : 0;
  }
  for (const [symbol, quantity, avg_cost] of HOLDINGS) {
    const [row, created] = await db.PortfolioHolding.findOrCreate({ where: { user_id: USER, symbol }, defaults: { user_id: USER, symbol, quantity, avg_cost } });
    if (!created) await row.update({ quantity, avg_cost });
    h++;
  }
  console.log(JSON.stringify({ ok: true, user: USER, watchlist: WATCH.length, holdings: h }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
