/* Seed a starter set of Investopedia-style financial glossary terms.
 * Run from the service dir:  node scripts/_seedGlossary.cjs
 */
const db = require('../models');

const TERMS = [
    {
        term: 'Compound Interest', slug: 'compound-interest', difficulty: 'beginner', category: 'Investing Basics',
        status: 'published',
        short_def: 'Interest calculated on both the initial principal and the accumulated interest from prior periods.',
        full_def: 'Compound interest is the addition of interest to the principal sum of a loan or deposit — interest on interest. It makes a balance grow faster than simple interest, which is calculated only on the principal. The effect compounds more powerfully the more frequently interest is added and the longer the money is invested.',
        formula_latex: 'A = P\\left(1 + \\frac{r}{n}\\right)^{nt}',
        aliases: ['compounding'],
        references: [{ title: 'U.S. SEC — Compound Interest Calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', kind: 'web' }],
        examples: [
            { title: '$1,000 at 7% for 30 years', body: 'Investing $1,000 at a 7% annual rate compounded monthly grows to about $8,116 after 30 years — versus $3,100 with simple interest.', sort_order: 0 },
        ],
    },
    {
        term: 'Inflation', slug: 'inflation', difficulty: 'beginner', category: 'Economics',
        status: 'published',
        short_def: 'The rate at which the general level of prices for goods and services rises, eroding purchasing power.',
        full_def: 'Inflation measures how much more expensive a set of goods and services has become over a period, usually a year. Moderate inflation is a sign of a growing economy, but high inflation erodes the real value of savings and fixed incomes. Central banks target a low, stable inflation rate (often around 2%).',
        aliases: ['CPI inflation'],
        references: [],
        examples: [
            { title: 'Purchasing power', body: 'At 6% annual inflation, $100 today buys what about $74 would buy in five years.', sort_order: 0 },
        ],
    },
    {
        term: 'Diversification', slug: 'diversification', difficulty: 'beginner', category: 'Portfolio Management',
        status: 'published',
        short_def: 'Spreading investments across assets to reduce exposure to any single risk.',
        full_def: 'Diversification is a risk-management strategy that mixes a wide variety of investments within a portfolio. A diversified portfolio contains assets whose prices do not move in lockstep, so a loss in one position can be offset by gains in another. It reduces unsystematic (asset-specific) risk but not market-wide risk.',
        aliases: ["don't put all your eggs in one basket"],
        references: [],
        examples: [],
    },
    {
        term: 'Price-to-Earnings Ratio', slug: 'pe-ratio', difficulty: 'intermediate', category: 'Valuation',
        status: 'published',
        short_def: 'A valuation metric comparing a company share price to its earnings per share.',
        full_def: 'The price-to-earnings (P/E) ratio measures the price an investor pays for each unit of a company earnings. A high P/E can mean a stock is overvalued or that investors expect high growth; a low P/E can signal undervaluation or weak prospects. P/E is most useful when comparing companies in the same industry.',
        formula_latex: 'P/E = \\frac{\\text{Market Price per Share}}{\\text{Earnings per Share}}',
        aliases: ['PE', 'P/E', 'price earnings ratio'],
        references: [],
        examples: [
            { title: 'Worked example', body: 'A stock trading at $50 with $5 earnings per share has a P/E of 10 — investors pay $10 for every $1 of annual earnings.', sort_order: 0 },
        ],
    },
    {
        term: 'Exchange-Traded Fund', slug: 'etf', difficulty: 'beginner', category: 'Investment Vehicles',
        status: 'published',
        short_def: 'A basket of securities that trades on an exchange like a single stock.',
        full_def: 'An exchange-traded fund (ETF) pools money to buy a basket of assets — stocks, bonds, or commodities — and issues shares that trade on an exchange throughout the day. ETFs offer instant diversification, typically low fees, and intraday liquidity, which is why they are a popular building block for index investing.',
        aliases: ['ETFs'],
        references: [],
        examples: [],
    },
    {
        term: 'Liquidity', slug: 'liquidity', difficulty: 'intermediate', category: 'Markets',
        status: 'published',
        short_def: 'How quickly and cheaply an asset can be converted to cash without affecting its price.',
        full_def: 'Liquidity describes the ease of buying or selling an asset at a price close to its fair value. Cash is the most liquid asset; real estate and thinly traded stocks are less liquid. High market liquidity means tight bid-ask spreads and stable prices; a liquidity crunch can cause sharp price swings.',
        aliases: ['market liquidity'],
        references: [],
        examples: [],
    },
];

// related-term edges by slug
const RELATIONS = [
    { from: 'compound-interest', to: 'inflation', relation: 'contrast' },
    { from: 'diversification', to: 'etf', relation: 'related' },
    { from: 'pe-ratio', to: 'etf', relation: 'related' },
    { from: 'etf', to: 'liquidity', relation: 'related' },
    { from: 'liquidity', to: 'diversification', relation: 'related' },
];

async function run() {
    await db.sequelize.authenticate();
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
    await db.sequelize.sync({ alter: false });

    const bySlug = {};
    for (const t of TERMS) {
        const { examples = [], ...termFields } = t;
        const [row] = await db.GlossaryTerm.findOrCreate({ where: { slug: t.slug }, defaults: termFields });
        bySlug[t.slug] = row;
        await db.GlossaryExample.destroy({ where: { term_id: row.id } });
        if (examples.length) {
            await db.GlossaryExample.bulkCreate(examples.map((e, i) => ({ term_id: row.id, title: e.title || null, body: e.body, sort_order: e.sort_order ?? i })));
        }
    }

    for (const r of RELATIONS) {
        const from = bySlug[r.from];
        const to = bySlug[r.to];
        if (!from || !to) continue;
        await db.GlossaryRelation.findOrCreate({
            where: { term_id: from.id, related_id: to.id, relation: r.relation },
            defaults: { term_id: from.id, related_id: to.id, relation: r.relation },
        });
    }

    console.log(`[seed] glossary: ${TERMS.length} terms, ${RELATIONS.length} relations upserted.`);
}

run().then(() => process.exit(0)).catch((e) => { console.error('[seed] failed:', e.message); process.exit(1); });
