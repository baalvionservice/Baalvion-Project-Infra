/* Seed imperialpedia.creator_profiles with real creator rows. Each row carries the lean
   base columns (queryable) AND `meta` = the full public CreatorProfile the frontend renders.
   Idempotent (upsert by user_id). Run with inline DB env (dotenv is cwd-relative):
   DB_HOST=localhost DB_PORT=5432 DB_NAME=baalvion_db DB_USER=baalvion DB_PASSWORD=baalvion_dev_pass \
     JWT_PUBLIC_KEY=seed-dummy node scripts/_seedCreators.cjs */
const db = require('../models');

const mk = (user_id, p) => ({ user_id, p });

// p = full frontend CreatorProfile (id/username/displayName/title/company/bio/avatar/
// joinedDate/specialties/category/region/verified/yearsExperience/education/badges/stats/content/socialLinks)
const CREATORS = [
  mk(101, {
    id: 'creator-michael', username: 'mroberts', displayName: 'Michael Roberts',
    title: 'Senior Market Analyst', company: 'Roberts Asset Management',
    bio: 'Specializing in equity research and macro-economic cycles. Over 12 years of institutional experience.',
    avatar: 'https://picsum.photos/seed/michael/200/200', joinedDate: '2022-10-15T00:00:00Z',
    specialties: ['Equity Research', 'Macroeconomics', 'Portfolio Management'], category: 'Economics',
    region: 'North America', verified: true, yearsExperience: 12, education: 'London School of Economics',
    badges: ['Verified Analyst', 'Senior Analyst', 'CFA Certified'],
    stats: { followersCount: 15400, followingCount: 85, articlesCount: 56, totalViews: 1250000, totalReads: 502000, engagementScore: 92, credibilityScore: 92, accuracyScore: 88 },
    content: { recentArticles: [{ id: 'art-m1', title: 'Global Liquidity and Stock Market Cycles', slug: 'global-liquidity-cycles', category: 'Macro Analysis', publishedAt: '2024-03-10T10:00:00Z', reads: 50200, likes: 4200, comments: 124 }] },
    socialLinks: [{ platform: 'Twitter', url: '#' }, { platform: 'LinkedIn', url: '#' }],
  }),
  mk(102, {
    id: 'creator-elena', username: 'egarcia', displayName: 'Elena Garcia',
    title: 'Crypto Research Analyst', company: 'Independent Analyst',
    bio: 'Focused on blockchain protocol architecture and the intersection of DeFi and institutional finance.',
    avatar: 'https://picsum.photos/seed/elena/200/200', joinedDate: '2023-03-20T00:00:00Z',
    specialties: ['Cryptocurrency', 'Blockchain', 'Risk Management'], category: 'Crypto',
    region: 'Europe', verified: true, yearsExperience: 8, education: 'MIT Sloan',
    badges: ['Verified Analyst', 'Crypto Market Specialist'],
    stats: { followersCount: 9800, followingCount: 120, articlesCount: 34, totalViews: 850000, totalReads: 384000, engagementScore: 88, credibilityScore: 88, accuracyScore: 94 },
    content: { recentArticles: [{ id: 'art-e1', title: 'Ethereum ETF Impact Explained', slug: 'ethereum-etf-impact', category: 'Crypto Analysis', publishedAt: '2024-03-12T11:00:00Z', reads: 38400, likes: 3100, comments: 240 }] },
    socialLinks: [{ platform: 'Twitter', url: '#' }, { platform: 'Github', url: '#' }],
  }),
  mk(103, {
    id: 'creator-sarah', username: 'smitchell', displayName: 'Sarah Mitchell',
    title: 'Market Strategist', company: undefined,
    bio: 'Specializing in macro-economic cycles and global interest rate arbitrage. 15 years of institutional research.',
    avatar: 'https://picsum.photos/seed/sarah/200/200', joinedDate: '2023-01-15T00:00:00Z',
    specialties: ['Macroeconomics', 'Market Analysis', 'Bonds'], category: 'Economics',
    region: 'North America', verified: true, yearsExperience: 15, education: 'Wharton MBA, CFA',
    badges: ['Verified Analyst', 'Top Contributor', 'Market Strategist'],
    stats: { followersCount: 12800, followingCount: 142, articlesCount: 42, totalViews: 850000, totalReads: 452000, engagementScore: 94, credibilityScore: 95, accuracyScore: 91 },
    content: { recentArticles: [{ id: 'art-1', title: 'Understanding Market Cycles', slug: 'understanding-market-cycles', category: 'Market Analysis', publishedAt: '2024-03-01T10:00:00Z', reads: 45200, likes: 3200 }] },
    socialLinks: [{ platform: 'Twitter', url: '#' }, { platform: 'LinkedIn', url: '#' }],
  }),
  mk(104, {
    id: 'creator-eleanor', username: 'econvance', displayName: 'Eleanor Vance',
    title: 'Lead Administrator', company: 'Imperialpedia',
    bio: 'Lead Administrator and Content Strategist at Imperialpedia. Focused on platform growth and institutional research.',
    avatar: 'https://picsum.photos/seed/eleanor/200/200', joinedDate: '2022-12-01T00:00:00Z',
    specialties: ['Economics', 'Growth', 'Strategy'], category: 'Economics',
    region: 'North America', verified: true, yearsExperience: 18, education: 'Harvard Business School',
    badges: ['Verified Analyst', 'Founding Contributor'],
    stats: { followersCount: 25000, followingCount: 500, articlesCount: 120, totalViews: 4500000, totalReads: 1800000, engagementScore: 96, credibilityScore: 98, accuracyScore: 92 },
    content: { recentArticles: [] },
    socialLinks: [{ platform: 'Twitter', url: '#' }, { platform: 'LinkedIn', url: '#' }],
  }),
];

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (const { user_id, p } of CREATORS) {
    const base = {
      user_id,
      display_name: p.displayName,
      bio: p.bio,
      avatar_url: p.avatar,
      specialization: p.specialties || [],
      article_count: p.stats.articlesCount || 0,
      followers_count: p.stats.followersCount || 0,
      total_views: p.stats.totalViews || 0,
      reputation_score: p.stats.credibilityScore || 0,
      is_verified: !!p.verified,
      social_links: (p.socialLinks || []).reduce((o, s) => ({ ...o, [s.platform]: s.url }), {}),
      meta: p,
    };
    const [row, created] = await db.CreatorProfile.findOrCreate({ where: { user_id }, defaults: base });
    if (!created) await row.update(base);
    n++;
  }
  console.log(JSON.stringify({ ok: true, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
