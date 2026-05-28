'use strict';
/**
 * Demo seed data so the app's pages render real, dynamic content.
 * Idempotent: demo users use fixed UUIDs (find-or-create) and collection
 * sections are skipped when already populated.
 *
 *   node seed.js
 */
const bcrypt = require('bcryptjs');
const db = require('./models');
const { computeScores } = require('./utils/score');

const PWD_HASH = bcrypt.hashSync('Passw0rd!', 10);

// Fixed ids keep re-runs idempotent and let threads/deals reference users stably.
const USERS = [
    { id: '11111111-1111-4111-8111-111111111111', email: 'marcus@elite.test', username: 'marcuschen', full_name: 'Marcus Chen', points: 2847, streak: 47, bio: 'Macro trader. Ex-hedge fund PM.', roles: ['user', 'moderator', 'admin'] },
    { id: '22222222-2222-4222-8222-222222222222', email: 'sarah@elite.test', username: 'sarahw', full_name: 'Sarah Williams', points: 2103, streak: 31, bio: 'AI + quant systems builder.', roles: ['user'] },
    { id: '33333333-3333-4333-8333-333333333333', email: 'james@elite.test', username: 'jpatterson', full_name: 'James Patterson', points: 1780, streak: 22, bio: '3x founder, 2 exits. Angel investor.', roles: ['user'] },
    { id: '44444444-4444-4444-8444-444444444444', email: 'elena@elite.test', username: 'elenar', full_name: 'Elena Rodriguez', points: 1456, streak: 18, bio: 'Wealth structuring & tax strategy.', roles: ['user'] },
    { id: '55555555-5555-4555-8555-555555555555', email: 'david@elite.test', username: 'davidkim', full_name: 'David Kim', points: 980, streak: 9, bio: 'Real estate & private credit.', roles: ['user'] },
];

const TAGS = [
    { name: 'Markets', slug: 'markets', color: '#22c55e', icon: '📈' },
    { name: 'Technology', slug: 'technology', color: '#3b82f6', icon: '🤖' },
    { name: 'Real Estate', slug: 'real-estate', color: '#f59e0b', icon: '🏢' },
    { name: 'Crypto', slug: 'crypto', color: '#8b5cf6', icon: '🪙' },
    { name: 'Startups', slug: 'startups', color: '#ec4899', icon: '🚀' },
    { name: 'Strategy', slug: 'strategy', color: '#06b6d4', icon: '🎯' },
];

const PRODUCTS = [
    { name: 'Private Jet Charter Credits', category: 'vip_deals', price: 25000, image: 'jet', featured: true, stock: 5, desc: 'Members-only charter credits at preferential rates.' },
    { name: 'First-Class Flight Concierge', category: 'flights', price: 4999, image: 'flight', stock: 20, desc: 'White-glove first-class booking and upgrades worldwide.' },
    { name: 'Elite Hosting — Dedicated Cluster', category: 'hosting', price: 499, image: 'server', stock: 50, desc: 'High-availability dedicated compute for your ventures.' },
    { name: 'Bare-Metal GPU Server', category: 'hosting', price: 1499, image: 'gpu', stock: 12, desc: 'A100-class GPUs for AI workloads, monthly.' },
    { name: 'Mastering Market Microstructure', category: 'courses', price: 1299, discount: 999, image: 'course1', featured: true, stock: 100, desc: 'Deep-dive course on order flow and execution.' },
    { name: 'Quant Strategies Masterclass', category: 'courses', price: 899, discount: 699, image: 'course2', stock: 100, desc: 'Build, backtest and deploy systematic strategies.' },
    { name: 'Baalvion Signature Hoodie', category: 'merchandise', price: 189, image: 'hoodie', stock: 200, desc: 'Premium heavyweight cotton, members edition.' },
    { name: 'Private Members Pin (18k)', category: 'merchandise', price: 450, image: 'pin', stock: 75, desc: 'Solid gold lapel pin for verified members.' },
];

const THREADS = [
    // ── Market Strategy ──
    { slug: 'market-strategy', author: 0, title: 'Q4 2025 Market Predictions: Where Smart Money Is Moving', views: 1240, pinned: false, tags: ['markets', 'strategy'],
      replies: [[1, 'Great breakdown. I’m rotating into energy and short-duration credit.'], [2, 'The liquidity setup agrees with this. Watching the 10Y closely.']] },
    { slug: 'market-strategy', author: 3, title: 'Reading the Yield Curve: A Practical Playbook', views: 640, pinned: false, tags: ['markets', 'strategy'],
      replies: [[4, 'The 2s10s re-steepening is the tell everyone is missing.']] },
    { slug: 'market-strategy', author: 4, title: 'Sector Rotation Signals I’m Watching Into 2026', views: 512, pinned: false, tags: ['markets'],
      replies: [[0, 'Industrials + energy momentum looks early-cycle to me.']] },
    // ── System Cracking ──
    { slug: 'system-cracking', author: 1, title: 'The AI Trading Framework That Changed My Portfolio', views: 980, pinned: false, tags: ['technology', 'markets'],
      replies: [[0, 'Which features mattered most in your model?'], [4, 'Backtested this approach — Sharpe held up out of sample.']] },
    { slug: 'system-cracking', author: 1, title: 'Automating Due Diligence with LLM Pipelines', views: 430, pinned: false, tags: ['technology'],
      replies: [[2, 'We cut diligence time 70% with a similar setup.']] },
    { slug: 'system-cracking', author: 2, title: 'Building a Personal “Second Brain” for Deal Flow', views: 388, pinned: false, tags: ['technology', 'startups'],
      replies: [[3, 'Notion + embeddings has been a game changer for me.']] },
    // ── Startup Hub ──
    { slug: 'startup-hub', author: 2, title: 'From Seed to Series A: Lessons From 3 Exits', views: 1560, pinned: false, tags: ['startups', 'strategy'],
      replies: [[3, 'The point about default-alive is underrated.'], [1, 'Saving this. The cap table advice is gold.']] },
    { slug: 'startup-hub', author: 1, title: 'How We Got Our First 100 Enterprise Customers', views: 742, pinned: false, tags: ['startups'],
      replies: [[2, 'Founder-led sales until $1M ARR — 100%.']] },
    { slug: 'startup-hub', author: 3, title: 'Founder Mental Health: The Unspoken Edge', views: 566, pinned: false, tags: ['startups'],
      replies: [[4, 'Thank you for writing this. Needed it today.']] },
    // ── Wealth Building ──
    { slug: 'wealth-building', author: 3, title: 'Tax-Efficient Wealth Structures for HNWIs', views: 720, pinned: false, tags: ['strategy', 'real-estate'],
      replies: [[4, 'Trust + holdco structure has worked well for me.']] },
    { slug: 'wealth-building', author: 4, title: 'Private Credit: The Yield Play Few Talk About', views: 486, pinned: false, tags: ['strategy'],
      replies: [[3, 'Direct lending funds have been a steady 9-11% for us.']] },
    { slug: 'wealth-building', author: 4, title: 'Real Estate vs Equities Over 20 Years — Real Numbers', views: 690, pinned: false, tags: ['real-estate'],
      replies: [[0, 'Leverage + tax treatment is why RE wins for many.']] },
    // ── Elite Lounge ──
    { slug: 'elite-lounge', author: 0, title: 'Welcome to the Elite Lounge — Introduce Yourself', views: 2210, pinned: true, tags: ['strategy'],
      replies: [[1, 'Sarah here — building AI quant systems.'], [2, 'James, 3x founder. Happy to help on fundraising.'], [3, 'Elena — wealth structuring.']] },
    { slug: 'elite-lounge', author: 0, title: 'What’s the best decision you made this year?', views: 870, pinned: false, tags: ['strategy'],
      replies: [[2, 'Said no to a big-but-wrong partnership.'], [4, 'Hired slowly, fired fast.']] },
    { slug: 'elite-lounge', author: 2, title: 'Book recommendations that actually moved the needle', views: 548, pinned: false, tags: ['strategy'],
      replies: [[1, 'The Almanack of Naval Ravikant.'], [3, 'Poor Charlie’s Almanack — required reading.']] },
];

const DEALS = [
    { founder: 0, title: 'NeuralEdge — AI Infrastructure for Hedge Funds', funding: 2000000, stage: 'Series A', category: 'AI / Fintech', pitch: 'Low-latency inference infra purpose-built for systematic funds.' },
    { founder: 1, title: 'Verdant — Carbon Credit Marketplace', funding: 1500000, stage: 'Seed', category: 'ClimateTech', pitch: 'Transparent, audited carbon credits with on-chain settlement.' },
    { founder: 2, title: 'Helios — Solar Microgrids for Emerging Markets', funding: 5000000, stage: 'Series B', category: 'Energy', pitch: 'Financing + deploying microgrids across high-growth regions.' },
    { founder: 3, title: 'Atlas — Cross-border Payments for SMBs', funding: 3000000, stage: 'Series A', category: 'Fintech', pitch: 'Stablecoin rails that cut cross-border fees by 80%.' },
];

const INVESTORS = [
    { name: 'Alexandra Reyes', firm: 'Northstar Ventures', title: 'Managing Partner', type: 'VC', region: 'North America', location: 'San Francisco, USA', hq: 'San Francisco, CA', aum: 850000000, verified: true, backed: 24, min: 250000, max: 2000000,
      thesis: 'Backing technical founders rebuilding financial infrastructure from first principles.', sectors: ['Fintech', 'AI', 'Infrastructure'], stages: ['Seed', 'Series A'], portfolio: ['NeuralEdge', 'Atlas', 'Lumen'] },
    { name: 'Daniel Okonkwo', firm: 'Meridian Capital', title: 'General Partner', type: 'VC', region: 'Europe', location: 'London, UK', hq: 'London, UK', aum: 1200000000, verified: true, backed: 31, min: 1000000, max: 10000000,
      thesis: 'Climate and energy transition at industrial scale. We fund the hard stuff.', sectors: ['ClimateTech', 'Energy', 'Hardware'], stages: ['Series A', 'Series B'], portfolio: ['Helios', 'Verdant', 'GridIQ'] },
    { name: 'Priya Nair', firm: 'Ascend Angels', title: 'Angel Investor', type: 'Angel', region: 'Asia', location: 'Bangalore, India', hq: 'Bangalore, India', aum: 40000000, verified: true, backed: 47, min: 25000, max: 150000,
      thesis: 'First-check believer in solo and technical founders. Speed and conviction.', sectors: ['SaaS', 'Consumer', 'AI'], stages: ['Pre-Seed', 'Seed'], portfolio: ['DeepWork', 'Nova'] },
    { name: 'Marcus Holloway', firm: 'Apex Growth', title: 'Partner', type: 'PE', region: 'North America', location: 'New York, USA', hq: 'New York, NY', aum: 3400000000, verified: true, backed: 18, min: 5000000, max: 25000000,
      thesis: 'Growth-stage marketplaces and fintech with proven unit economics.', sectors: ['Fintech', 'Marketplaces'], stages: ['Series B', 'Series C'], portfolio: ['Atlas', 'PayLoop'] },
    { name: 'Sofia Bianchi', firm: 'Lattice Fund', title: 'Principal', type: 'VC', region: 'Europe', location: 'Berlin, Germany', hq: 'Berlin, Germany', aum: 320000000, verified: false, backed: 22, min: 500000, max: 3000000,
      thesis: 'Developer tools and AI infrastructure that compounds over time.', sectors: ['Developer Tools', 'AI', 'Infrastructure'], stages: ['Seed', 'Series A'], portfolio: ['NeuralEdge', 'Forge'] },
    { name: 'James Whitfield', firm: 'Harbor Equity', title: 'Managing Director', type: 'Family Office', region: 'Asia', location: 'Singapore', hq: 'Singapore', aum: 2100000000, verified: true, backed: 29, min: 2000000, max: 15000000,
      thesis: 'Real assets, private credit, and durable yield across cycles.', sectors: ['Real Estate', 'Private Credit'], stages: ['Series A', 'Growth'], portfolio: ['Harborview', 'Yieldly'] },
    { name: 'Lena Kowalski', firm: 'Seed Forge', title: 'Founding Partner', type: 'VC', region: 'North America', location: 'Toronto, Canada', hq: 'Toronto, Canada', aum: 110000000, verified: false, backed: 35, min: 100000, max: 750000,
      thesis: 'Pre-product technical teams solving deeply unsexy problems.', sectors: ['AI', 'Deep Tech', 'SaaS'], stages: ['Pre-Seed', 'Seed'], portfolio: ['Forge', 'DeepWork', 'Nova'] },
    { name: 'Omar Haddad', firm: 'Crescent Ventures', title: 'Partner', type: 'CVC', region: 'Middle East', location: 'Dubai, UAE', hq: 'Dubai, UAE', aum: 600000000, verified: true, backed: 20, min: 250000, max: 3000000,
      thesis: 'MENA and emerging-markets fintech, payments, and consumer.', sectors: ['Fintech', 'Payments', 'Consumer'], stages: ['Seed', 'Series A'], portfolio: ['PayLoop', 'Atlas'] },
];

const img = (s) => `https://picsum.photos/seed/${s}/600/400`;
const av = (s) => `https://i.pravatar.cc/150?u=${s}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const domainOf = (firm) => `${slug(firm)}.com`;
const firstName = (n) => n.split(' ')[0].toLowerCase();

// Founder profiles for the demo users (index-aligned with USERS above).
const SAMPLE_VIDEOS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
];
const FOUNDER_INFO = [
    { company: 'Helios Labs', region: 'North America', sector: 'ClimateTech', stage: 'Seed',
      about: 'Helios Labs builds financing + deployment software for solar microgrids in high-growth regions.',
      idea: 'We are building the operating system for distributed energy in emerging markets. Today, deploying a solar microgrid means stitching together hardware vendors, local financiers, and manual field operations — it takes 9-18 months and most projects die in diligence. Helios collapses that to weeks: a single platform that underwrites the site, structures the financing, manages procurement, and monitors performance post-install. Our wedge is the underwriting model — we have 6 years of operational data across 1,200 sites that lets us price risk no incumbent can. The market is the 700M people without reliable grid power plus the commercial & industrial sites paying 3x grid rates for diesel. We monetize via a software fee plus a slice of the financing spread.',
      interview: [{ question: 'What problem are you solving?', answer: 'Reliable, financeable distributed power for places the grid fails.' }, { question: 'Why you?', answer: 'I spent 6 years deploying microgrids the hard way; I am building the tool I wished existed.' }, { question: 'What are you raising for?', answer: 'An $2M seed to expand underwriting into two new regions and ship the financing module.' }] },
    { company: 'NeuralEdge', region: 'North America', sector: 'AI', stage: 'Series A',
      about: 'Low-latency inference infrastructure purpose-built for systematic funds and AI products.',
      idea: 'NeuralEdge is inference infrastructure for teams that cannot tolerate latency or downtime. General-purpose GPU clouds are optimized for training, not for the millisecond-sensitive, bursty inference that trading systems and real-time AI products need. We provide a runtime + scheduler that co-locates models with data, hot-swaps weights without dropping requests, and autoscales on signal rather than CPU. Early customers cut p99 latency by 70% and infra spend by 40%. The thesis: as AI moves from training to serving, the bottleneck shifts to inference economics, and whoever owns that layer owns the margin.',
      interview: [{ question: 'What is the wedge?', answer: 'Latency-sensitive inference for quant + real-time AI.' }, { question: 'Traction?', answer: 'Six paying design partners, $480k ARR, 12% MoM.' }] },
    { company: 'Atlas Pay', region: 'Asia', sector: 'Fintech', stage: 'Seed',
      about: 'Stablecoin rails that cut cross-border payment fees for SMBs by up to 80%.',
      idea: 'Atlas Pay lets small and mid-sized businesses move money across borders at a fraction of the cost of correspondent banking. SMBs in emerging markets lose 6-9% to FX and intermediary fees on every cross-border invoice. We route payments over regulated stablecoin rails and settle into local currency, charging a flat 1%. The hard part is compliance and last-mile payout — we have built licensed payout partners in 8 corridors and an automated KYB flow. We win because we are corridor-first and compliance-native, not crypto-native.',
      interview: [{ question: 'Why now?', answer: 'Stablecoin regulation finally gives us a compliant path SMBs trust.' }, { question: 'Moat?', answer: 'Licensed payout network + KYB automation across 8 corridors.' }] },
    { company: 'Verdant', region: 'Europe', sector: 'ClimateTech', stage: 'Pre-Seed',
      about: 'A transparent, audited carbon-credit marketplace with on-chain settlement.',
      idea: 'Verdant fixes the trust problem in voluntary carbon markets. Buyers cannot tell a high-integrity credit from junk, and double-counting is rampant. We onboard verified project developers, attach a full audit trail to every credit, and settle on-chain so retirement is provable and final. Corporates get defensible offsets; developers get faster access to capital. We take a marketplace fee plus a premium for our verification layer.',
      interview: [{ question: 'What breaks today?', answer: 'No buyer can trust what a credit actually represents.' }, { question: 'Your fix?', answer: 'Audited provenance + provable on-chain retirement.' }] },
    { company: 'Harborview', region: 'Asia', sector: 'Real Estate', stage: 'Series A',
      about: 'Private-credit underwriting for income-producing real assets across Asia.',
      idea: 'Harborview is a private-credit platform for income-producing real estate in Asia. Mid-market property owners are underserved by banks and pay punitive rates to informal lenders. We underwrite with cashflow data and local market signals, originate senior secured loans, and syndicate them to institutional capital. Our edge is the data — we have digitized rent rolls and operating data across 3,000 assets, which lets us price and monitor risk continuously rather than at origination.',
      interview: [{ question: 'Who do you serve?', answer: 'Mid-market property owners banks ignore.' }, { question: 'Edge?', answer: 'Continuous cashflow-based underwriting on 3,000 assets.' }] },
];

// Deterministic-ish rich intelligence generators per investor.
const NEWS_SOURCES = ['TechCrunch', 'Bloomberg', 'Reuters', 'Forbes', 'Axios Pro Rata'];
const ROUNDS = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

function socialsFor(inv) {
    const h = firstName(inv.name) + slug(inv.firm).slice(0, 4);
    const out = [
        { platform: 'website', url: `https://${domainOf(inv.firm)}`, handle: domainOf(inv.firm), source: 'Official site' },
        { platform: 'linkedin', url: `https://linkedin.com/in/${inv.name.toLowerCase().replace(/\s+/g, '-')}`, handle: inv.name, followers: 1200 + (inv.backed * 137 % 9000), source: 'LinkedIn' },
        { platform: 'twitter', url: `https://x.com/${h}`, handle: `@${h}`, followers: 3000 + (inv.backed * 211 % 40000), source: 'Verified via firm site' },
    ];
    if (inv.type === 'Angel' || inv.type === 'VC') out.push({ platform: 'instagram', url: `https://instagram.com/${h}`, handle: `@${h}`, followers: 800 + (inv.backed * 97 % 12000), source: 'Linked from site' });
    return out;
}

function investmentsFor(inv) {
    const base = (inv.portfolio || []);
    const extra = ['Lumen', 'GridIQ', 'PayLoop', 'Forge', 'Nova', 'Yieldly', 'Harborview', 'DeepWork'];
    const companies = [...new Set([...base, ...extra])].slice(0, 5);
    return companies.map((c, i) => {
        const amt = Math.round(((inv.min + inv.max) / 2) * (0.5 + ((i * 37) % 100) / 100) / 1000) * 1000;
        const round = ROUNDS[(inv.backed + i) % ROUNDS.length];
        const d = new Date(); d.setMonth(d.getMonth() - (i * 3 + 1));
        return { target_company: c, round, amount_usd: amt, invested_on: d.toISOString().slice(0, 10), source_name: NEWS_SOURCES[i % NEWS_SOURCES.length], source_url: `https://${slug(NEWS_SOURCES[i % NEWS_SOURCES.length])}.com/${slug(c)}-${slug(round)}` };
    });
}

function newsFor(inv) {
    const items = [
        { headline: `${inv.firm} leads ${inv.sectors[0]} round as ${inv.type} appetite grows`, sentiment: 'positive' },
        { headline: `${inv.name} on the future of ${inv.sectors[0]}: "we're early, not late"`, sentiment: 'neutral' },
        { headline: `${inv.firm} expands ${inv.region} presence with new ${inv.stages[0]} mandate`, sentiment: 'positive' },
    ];
    return items.map((n, i) => {
        const d = new Date(); d.setDate(d.getDate() - (i * 5 + 2));
        const src = NEWS_SOURCES[(inv.backed + i) % NEWS_SOURCES.length];
        return { headline: n.headline, summary: `${src} reports on ${inv.firm}'s latest activity in ${inv.sectors.join(', ')}.`, source: src, sentiment: n.sentiment, published_at: d.toISOString(), url: `https://${slug(src)}.com/${slug(inv.firm)}-${i}` };
    });
}

async function seed() {
    await db.sequelize.authenticate();

    // ── Users / profiles / roles / founder profile / membership ─────────────────
    const userIds = [];
    for (let idx = 0; idx < USERS.length; idx++) {
        const u = USERS[idx];
        await db.User.findOrCreate({ where: { id: u.id }, defaults: { id: u.id, email: u.email, password_hash: PWD_HASH, email_verified: true } });
        const [profile] = await db.Profile.findOrCreate({ where: { id: u.id }, defaults: { id: u.id, username: u.username, full_name: u.full_name, bio: u.bio, points: u.points, streak_days: u.streak, avatar_url: av(u.username) } });
        for (const r of u.roles) await db.UserRole.findOrCreate({ where: { user_id: u.id, role: r }, defaults: { user_id: u.id, role: r } });
        // Founder profile + active membership for the demo users.
        const f = FOUNDER_INFO[idx];
        if (f) {
            const RAISE = [
                { round: 'Seed', amt: 2000000, val: 12000000 }, { round: 'Series A', amt: 8000000, val: 45000000 },
                { round: 'Seed', amt: 1500000, val: 9000000 }, { round: 'Pre-Seed', amt: 500000, val: 5000000 },
                { round: 'Series A', amt: 6000000, val: 30000000 },
            ][idx % 5];
            await profile.update({
                role: 'founder', company_name: f.company, company_about: f.about, region: f.region, sector: f.sector, stage: f.stage,
                idea: f.idea, interview: f.interview, video_url: SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length],
                contact_email: u.email, contact_phone: `+1 (415) 555-${String(2000 + idx * 111).slice(0, 4)}`,
                linkedin_url: `https://linkedin.com/in/${u.username}`, website: `https://${slug(f.company)}.com`,
                headline: f.about, business_model: 'B2B SaaS', target_market: 'B2B',
                problem: `Incumbents in ${f.sector} are slow, expensive, and not built for ${f.region}.`,
                solution: f.about,
                why_now: `Regulation, AI, and shifting capital flows make ${f.sector} a now-or-never opportunity.`,
                differentiation: `Proprietary data + ${f.stage}-stage focus competitors lack.`,
                market_tam: '$40B+ and expanding double digits annually.',
                skills: ['Technical', 'Fundraising', '0→1', f.sector], founder_strengths: ['Product', 'Sales'],
                work_experience: [{ company: 'Prior Co', role: 'Founder / Operator', start: '2019', end: '2023', current: false }],
                pitch_deck_url: `https://${slug(f.company)}.com/deck.pdf`,
                raising: idx % 2 === 0, round_type: RAISE.round, raise_amount: RAISE.amt, valuation: RAISE.val,
                instrument: 'SAFE', use_of_funds: 'Engineering, GTM, and key hires.',
            });
            // Traction time-series (last 5 months).
            if (await db.TractionMetric.count({ where: { founder_id: u.id } }) === 0) {
                const base = 8000 + idx * 3000;
                for (let m = 4; m >= 0; m--) {
                    const d = new Date(); d.setMonth(d.getMonth() - m); const asOf = d.toISOString().slice(0, 10);
                    const grow = Math.pow(1.22, 4 - m);
                    await db.TractionMetric.create({ founder_id: u.id, metric_key: 'mrr', label: 'MRR', value: Math.round(base * grow), unit: '$', as_of: asOf, source: 'Stripe', verified: idx < 2 });
                    await db.TractionMetric.create({ founder_id: u.id, metric_key: 'users', label: 'Active users', value: Math.round((200 + idx * 120) * grow), unit: 'users', as_of: asOf, source: 'Analytics', verified: false });
                }
                await db.TractionMetric.create({ founder_id: u.id, metric_key: 'growth', label: 'MoM growth', value: 22, unit: '%', as_of: new Date().toISOString().slice(0, 10), source: 'Stripe', verified: idx < 2 });
            }
            // Team
            if (await db.CompanyMember.count({ where: { founder_id: u.id } }) === 0) {
                await db.CompanyMember.create({ founder_id: u.id, name: u.full_name, member_role: 'cofounder', title: 'CEO & Founder', is_primary: true, avatar_url: av(u.username) });
                await db.CompanyMember.create({ founder_id: u.id, name: ['Riya Shah', 'Tom Webb', 'Ana Lopez', 'Ken Ito', 'Sara Vance'][idx % 5], member_role: 'cofounder', title: 'CTO', avatar_url: av('cto' + idx) });
            }
            // Verifications (email + domain verified for everyone; linkedin for some).
            for (const k of ['email', 'domain', ...(idx < 3 ? ['linkedin'] : [])]) {
                await db.Verification.findOrCreate({ where: { user_id: u.id, kind: k }, defaults: { user_id: u.id, kind: k, status: 'verified', verified_at: new Date() } });
            }
            // Score it.
            const metrics = await db.TractionMetric.findAll({ where: { founder_id: u.id } });
            const verifs = await db.Verification.findAll({ where: { user_id: u.id, status: 'verified' } });
            const sc = computeScores(profile.get({ plain: true }), metrics.map((m) => m.get({ plain: true })), verifs.map((v) => v.kind));
            await profile.update({ profile_score: sc.profile_score, readiness_score: sc.readiness_score, onboarding_complete: true, onboarding_step: 10 });
        }
        await db.Membership.findOrCreate({
            where: { user_id: u.id },
            defaults: { user_id: u.id, plan: 'founder', status: 'active', amount_usd: 299, started_at: new Date(), expires_at: new Date(Date.now() + 365 * 864e5), payment_ref: 'seed' },
        });
        userIds.push(u.id);
    }

    // ── Tags ───────────────────────────────────────────────────────────────────
    const tagBySlug = {};
    for (const t of TAGS) {
        const [row] = await db.Tag.findOrCreate({ where: { slug: t.slug }, defaults: { name: t.name, slug: t.slug, color: t.color, icon: t.icon } });
        tagBySlug[t.slug] = row.id;
    }

    // ── Products ─────────────────────────────────────────────────────────────────
    if (await db.Product.count() === 0) {
        for (const p of PRODUCTS) {
            await db.Product.create({ name: p.name, description: p.desc, category: p.category, price: p.price, discount_price: p.discount || null, image_url: img(p.image), is_featured: !!p.featured, stock_quantity: p.stock });
        }
    }

    // ── Forum threads + posts + tags ────────────────────────────────────────────
    const cats = await db.ForumCategory.findAll();
    const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    for (const th of THREADS) {
        const categoryId = catBySlug[th.slug];
        if (!categoryId) continue;
        if (await db.ForumThread.findOne({ where: { title: th.title } })) continue; // idempotent per-thread
        {
            const authorId = userIds[th.author];
            const thread = await db.ForumThread.create({ category_id: categoryId, author_id: authorId, title: th.title, status: 'open', views: th.views, is_pinned: th.pinned });
            // seed post (the original) + replies
            await db.ForumPost.create({ thread_id: thread.id, author_id: authorId, content: `${th.title}\n\nKicking off the discussion — share your take below.`, likes: Math.floor(th.views / 40) });
            for (const [ai, content] of th.replies) {
                await db.ForumPost.create({ thread_id: thread.id, author_id: userIds[ai], content, likes: Math.floor(Math.random() * 20) });
            }
            for (const tg of th.tags) {
                if (tagBySlug[tg]) await db.ThreadTag.create({ thread_id: thread.id, tag_id: tagBySlug[tg] });
            }
        }
    }

    // ── Deals ────────────────────────────────────────────────────────────────────
    for (const d of DEALS) {
        if (await db.Deal.findOne({ where: { title: d.title } })) continue; // idempotent per-deal
        await db.Deal.create({ founder_id: userIds[d.founder], title: d.title, pitch: d.pitch, description: d.pitch, problem: 'A large, underserved market with poor incumbents.', solution: d.pitch, business_model: 'B2B SaaS + transaction fees', funding_required: d.funding, expected_return: '5-10x over 5 years', stage: d.stage, category: d.category, status: 'active' });
    }

    // ── Investors directory + intelligence ──────────────────────────────────────
    for (const inv of INVESTORS) {
        const [row] = await db.Investor.findOrCreate({
            where: { name: inv.name },
            defaults: {
                name: inv.name, firm: inv.firm, title: inv.title, location: inv.location, avatar_url: av(inv.name),
                thesis: inv.thesis, focus_sectors: inv.sectors, stages: inv.stages, check_min: inv.min, check_max: inv.max,
                portfolio: inv.portfolio, deals_backed: inv.backed, is_verified: inv.verified,
                website: `https://${domainOf(inv.firm)}`,
                linkedin_url: `https://linkedin.com/in/${inv.name.toLowerCase().replace(/\s+/g, '-')}`,
            },
        });
        // Backfill the intelligence fields (covers investor rows created by earlier seed runs).
        await row.update({
            firm_type: inv.type, region: inv.region, headquarters: inv.hq, aum_usd: inv.aum,
            email: `${firstName(inv.name)}@${domainOf(inv.firm)}`,
            phone: `+1 (415) 555-${String(1000 + (inv.backed * 13 % 8999)).slice(0, 4)}`,
            enrichment_status: 'enriched', enrichment_confidence: inv.verified ? 'high' : 'medium', dedupe_key: slug(inv.name),
        });
        if (await db.InvestorSocial.count({ where: { investor_id: row.id } }) === 0) {
            for (const s of socialsFor(inv)) await db.InvestorSocial.create({ investor_id: row.id, ...s, last_checked_at: new Date() });
        }
        if (await db.Investment.count({ where: { investor_id: row.id } }) === 0) {
            for (const iv of investmentsFor(inv)) await db.Investment.create({ investor_id: row.id, ...iv });
        }
        if (await db.InvestorNews.count({ where: { investor_id: row.id } }) === 0) {
            for (const n of newsFor(inv)) await db.InvestorNews.create({ investor_id: row.id, ...n });
        }
    }

    // ── Sample founder -> investor intro requests (so the queue isn't empty) ──────
    if (await db.ConnectionRequest.count() === 0) {
        const founderId = USERS[2].id; // James Patterson (a founder)
        const alex = await db.Investor.findOne({ where: { name: 'Alexandra Reyes' } });
        const daniel = await db.Investor.findOne({ where: { name: 'Daniel Okonkwo' } });
        if (alex) await db.ConnectionRequest.create({ from_user_id: founderId, investor_id: alex.id, status: 'pending', message: 'Raising a $2M seed for an AI infra startup — your thesis lines up perfectly. Could we grab 15 minutes?' });
        if (daniel) await db.ConnectionRequest.create({ from_user_id: founderId, investor_id: daniel.id, status: 'pending', message: 'Climate-adjacent infrastructure play at Series A. Would value your perspective.' });
    }

    // ── Sample founder <-> founder connections ──────────────────────────────────
    if (await db.MemberConnection.count() === 0) {
        await db.MemberConnection.create({ from_user_id: USERS[2].id, to_user_id: USERS[1].id, status: 'pending', message: 'Loved your AI infra thesis — would love to compare notes.' });
        await db.MemberConnection.create({ from_user_id: USERS[3].id, to_user_id: USERS[2].id, status: 'accepted', message: 'Fellow climate/fintech founder — let’s connect.' });
    }

    // ── Investor CRM demo (marcus acts as the saving/pipelining investor) ────────
    const inv = USERS[0].id, jamesId = USERS[2].id, sarahId = USERS[1].id;
    if (await db.SavedStartup.count() === 0) {
        await db.SavedStartup.findOrCreate({ where: { investor_user_id: inv, founder_id: jamesId }, defaults: { investor_user_id: inv, founder_id: jamesId, list_name: 'Watchlist' } });
        await db.SavedStartup.findOrCreate({ where: { investor_user_id: inv, founder_id: sarahId }, defaults: { investor_user_id: inv, founder_id: sarahId, list_name: 'Watchlist' } });
    }
    if (await db.InvestorPipeline.count() === 0) {
        await db.InvestorPipeline.findOrCreate({ where: { investor_user_id: inv, founder_id: jamesId }, defaults: { investor_user_id: inv, founder_id: jamesId, stage: 'meeting', note: 'Strong founder-market fit. Met once.' } });
        await db.InvestorPipeline.findOrCreate({ where: { investor_user_id: inv, founder_id: sarahId }, defaults: { investor_user_id: inv, founder_id: sarahId, stage: 'reviewing', note: 'Reviewing the deck.' } });
    }
    if (await db.DataRoomAccess.count() === 0) {
        await db.DataRoomAccess.findOrCreate({ where: { founder_id: jamesId, investor_user_id: inv }, defaults: { founder_id: jamesId, investor_user_id: inv, status: 'granted' } });
    }

    // ── Elite leaderboard ────────────────────────────────────────────────────────
    if (await db.EliteLeaderboard.count() === 0) {
        const ranked = [...USERS].sort((a, b) => b.points - a.points);
        const badges = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
        for (let i = 0; i < ranked.length; i++) {
            const u = ranked[i];
            await db.EliteLeaderboard.create({ user_id: u.id, username: u.username, total_points: u.points, threads_created: Math.max(1, 5 - i), upvotes_received: Math.floor(u.points / 12), engagement_score: Math.round(u.points / 30), rank: i + 1, badge: badges[i] || 'Member' });
        }
    }

    // ── A couple of notifications for the top user ────────────────────────────────
    if (await db.Notification.count() === 0) {
        await db.Notification.create({ user_id: USERS[0].id, type: 'system', title: 'Welcome to Baalvion Elite Circle', message: 'Your membership is active. Explore deals, forums and the marketplace.', link: '/dashboard' });
        await db.Notification.create({ user_id: USERS[0].id, type: 'deal_interest', title: 'New investor interest', message: 'Sarah Williams is interested in "NeuralEdge"', link: '/deals' });
    }

    const counts = {
        users: await db.User.count(), products: await db.Product.count(), threads: await db.ForumThread.count(),
        posts: await db.ForumPost.count(), deals: await db.Deal.count(), leaderboard: await db.EliteLeaderboard.count(),
        investors: await db.Investor.count(), socials: await db.InvestorSocial.count(),
        investments: await db.Investment.count(), investor_news: await db.InvestorNews.count(),
        connection_requests: await db.ConnectionRequest.count(),
        memberships: await db.Membership.count(), member_connections: await db.MemberConnection.count(),
        traction: await db.TractionMetric.count(), team: await db.CompanyMember.count(),
        verifications: await db.Verification.count(), pipeline: await db.InvestorPipeline.count(),
    };
    console.log('[seed] done:', JSON.stringify(counts));
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch((e) => { console.error('[seed] error:', e); process.exit(1); });
}
module.exports = { seed };
