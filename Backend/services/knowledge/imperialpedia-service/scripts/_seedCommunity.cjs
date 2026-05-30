/* Seed imperialpedia.community_posts with finance discussion threads. Idempotent by title.
   Run with inline DB env (dotenv is cwd-relative). */
const db = require('../models');

const POSTS = [
  ['Is the Fed done hiking for this cycle?', 'With core inflation cooling toward 3%, markets are pricing two cuts this year. Are we finally at the end of the tightening cycle, or is one more hike still on the table?', 'Macro', ['Fed', 'Rates'], 142, 312],
  ['NVIDIA at these multiples — still a buy?', 'Forward P/E above 40x. The AI capex story is real but how much is already priced in? Curious how people are sizing positions here.', 'Stocks', ['NVDA', 'AI'], 98, 205],
  ['Bitcoin ETF flows are accelerating again', 'Largest single-day inflow in three months. On-chain shows long-term holders accumulating. Is $100k realistic this cycle?', 'Cryptocurrency', ['BTC', 'ETF'], 176, 421],
  ['Best high-yield savings right now?', 'Several online banks above 5% APY. Anyone moved a full emergency fund over? Any gotchas with transfer limits?', 'Personal Finance', ['Savings', 'APY'], 64, 88],
  ['Selling covered calls into earnings — worth it?', 'Premiums are juicy but assignment risk is real. How are you managing covered calls through earnings season?', 'Options Trading', ['Options', 'Income'], 41, 73],
  ['Gold above $2,400 — safe haven or bubble?', 'Central-bank buying plus a softer dollar. Is this a structural re-rating or a crowded trade due for a pullback?', 'Commodities', ['Gold', 'Macro'], 87, 130],
  ['Housing market finally cracking?', 'Existing home sales down 3.4% as mortgage rates pop back above 7%. Are we set for a real correction or just a stall?', 'Economy', ['Housing', 'Rates'], 73, 156],
  ['Day-trading SPY 0DTE — who is actually profitable?', 'Volume in zero-day options keeps climbing. Honest question: who here is consistently green doing this, and what is your edge?', 'Trading', ['SPY', '0DTE'], 55, 240],
];

const AUTHORS = [
  [101, 'Michael Roberts'], [102, 'Elena Garcia'], [103, 'Sarah Mitchell'], [104, 'Eleanor Vance'],
];

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (let i = 0; i < POSTS.length; i++) {
    const [title, content, category, tags, upvotes, comments_count] = POSTS[i];
    const [author_id, author_name] = AUTHORS[i % AUTHORS.length];
    const base = {
      author_id, author_name, title, content, category, tags,
      upvotes, downvotes: Math.floor(upvotes * 0.1), comments_count,
      is_pinned: i === 0, status: 'active',
    };
    const [row, created] = await db.CommunityPost.findOrCreate({ where: { title }, defaults: base });
    if (!created) await row.update(base);
    n++;
  }
  console.log(JSON.stringify({ ok: true, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
