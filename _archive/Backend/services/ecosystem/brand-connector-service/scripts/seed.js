/**
 * Brand Connector seed — realistic data for the demo org, idempotent (clears org rows then inserts).
 * Run: node scripts/seed.js
 * Demo user: brand-admin@baalvion.test / Passw0rd!23
 */
'use strict';
require('dotenv').config();
// Seeding only touches the DB (no token verification) — satisfy appConfig's JWT_PUBLIC_KEY guard.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '-----BEGIN PUBLIC KEY-----\nseed-placeholder\n-----END PUBLIC KEY-----';
const db = require('../models');

const ORG = '57bdc571-908c-4704-88dc-c23eda567e44';
const USER = 61;

(async () => {
  await db.sequelize.authenticate();
  console.log('Connected. Seeding org', ORG);

  // ── Idempotent reset (org-scoped tables) ──────────────────────────────────────
  const where = { org_id: ORG };
  await db.Deliverable.destroy({ where: {}, truncate: false }).catch(() => {});
  for (const M of [db.CampaignApplication, db.Partnership, db.Dispute, db.Payment, db.Proposal, db.Deal, db.LeadNote, db.Lead, db.Notification, db.Invoice, db.Subscription, db.Campaign, db.InfluencerProfile, db.BrandProfile, db.SystemLog, db.OutreachMessage, db.OutreachCampaign, db.AutomationRule, db.TeamMember]) {
    try { await M.destroy({ where }); } catch (e) { /* table may lack org scope */ }
  }

  // ── Brand profile ─────────────────────────────────────────────────────────────
  const brand = await db.BrandProfile.create({
    user_id: USER, org_id: ORG, brand_name: 'Baalvion Originals', tagline: 'Stories that move markets',
    description: 'In-house D2C brand spanning tech, lifestyle and wellness.', industry: 'Consumer Tech',
    categories: ['Tech & Gadgets', 'Lifestyle', 'Fitness & Wellness'], target_audience: 'Gen-Z & millennials, 18–34',
    budget_range_min: 500000, budget_range_max: 5000000, currency: 'INR',
    social_links: { instagram: '@baalvion', youtube: 'BaalvionOriginals' }, verified: true, status: 'active',
  });

  // ── Influencers / creators ─────────────────────────────────────────────────────
  const creatorsData = [
    { display_name: 'Aisha Khan', niche: ['Fashion & Style', 'Beauty'], platforms: ['Instagram', 'YouTube'], ig: 420000, yt: 180000, er: 4.8, rpp: 85000, country: 'India' },
    { display_name: 'Rohan Mehta', niche: ['Tech & Gadgets'], platforms: ['YouTube'], ig: 95000, yt: 610000, er: 6.2, rpp: 140000, country: 'India' },
    { display_name: 'Sofia Alvarez', niche: ['Travel & Adventure'], platforms: ['Instagram', 'TikTok'], ig: 780000, yt: 0, er: 5.1, rpp: 210000, country: 'United States' },
    { display_name: 'Liam Carter', niche: ['Fitness & Wellness'], platforms: ['Instagram'], ig: 305000, yt: 45000, er: 7.0, rpp: 90000, country: 'United Kingdom' },
    { display_name: 'Mei Lin', niche: ['Food & Cooking'], platforms: ['TikTok', 'Instagram'], ig: 540000, yt: 120000, er: 8.3, rpp: 160000, country: 'Singapore' },
    { display_name: 'Omar Farouk', niche: ['Gaming'], platforms: ['YouTube', 'Twitter'], ig: 70000, yt: 920000, er: 3.9, rpp: 175000, country: 'United Arab Emirates' },
  ];
  const creators = [];
  for (let i = 0; i < creatorsData.length; i++) {
    const c = creatorsData[i];
    creators.push(await db.InfluencerProfile.create({
      user_id: USER + 100 + i, org_id: ORG, display_name: c.display_name,
      bio: `${c.niche.join(', ')} creator. ${c.country}.`, niche: c.niche, platforms: c.platforms,
      follower_count_instagram: c.ig, follower_count_youtube: c.yt, engagement_rate: c.er,
      avg_views_per_post: Math.round(c.ig * (c.er / 100) * 6), rate_per_post: c.rpp, rate_per_story: Math.round(c.rpp / 3), rate_per_video: Math.round(c.rpp * 1.8),
    }));
  }

  // ── Campaigns ────────────────────────────────────────────────────────────────
  const today = new Date();
  const d = (off) => new Date(today.getTime() + off * 864e5).toISOString().slice(0, 10);
  const campaignsData = [
    { title: 'Summer Tech Launch', cats: ['Tech & Gadgets'], budget: 1200000, status: 'active', plat: ['Instagram', 'YouTube'], max: 8 },
    { title: 'Wellness Reset 2026', cats: ['Fitness & Wellness'], budget: 800000, status: 'active', plat: ['Instagram'], max: 6 },
    { title: 'Festive Fashion Edit', cats: ['Fashion & Style'], budget: 1500000, status: 'recruiting', plat: ['Instagram', 'TikTok'], max: 10 },
    { title: 'Global Travel Series', cats: ['Travel & Adventure'], budget: 2200000, status: 'active', plat: ['Instagram', 'YouTube'], max: 5 },
    { title: 'Foodie Collab', cats: ['Food & Cooking'], budget: 600000, status: 'completed', plat: ['TikTok'], max: 4 },
  ];
  const campaigns = [];
  for (const c of campaignsData) {
    campaigns.push(await db.Campaign.create({
      brand_id: brand.id, org_id: ORG, title: c.title, description: `${c.title} — a flagship influencer push.`,
      objectives: ['awareness', 'conversions'], platforms: c.plat, categories: c.cats, budget: c.budget, currency: 'INR',
      deliverable_type: ['reel', 'story'], start_date: d(-10), end_date: d(40), min_followers: 50000,
      min_engagement_rate: 3.0, max_influencers: c.max, current_influencers: Math.floor(c.max / 2), status: c.status,
      requirements: 'Authentic, on-brand content with clear CTA.', application_deadline: d(15),
      views_count: Math.floor(Math.random() * 50000), applications_count: 0,
    }));
  }

  // ── Applications ───────────────────────────────────────────────────────────────
  const appStatuses = ['pending', 'shortlisted', 'approved', 'rejected'];
  let appCount = 0;
  for (const camp of campaigns.slice(0, 4)) {
    for (let i = 0; i < 3; i++) {
      const cr = creators[(appCount + i) % creators.length];
      await db.CampaignApplication.create({
        campaign_id: camp.id, influencer_id: cr.id, org_id: ORG,
        pitch: `I'd love to collaborate on ${camp.title}. My audience aligns well.`,
        proposed_rate: cr.rate_per_post, currency: 'INR', portfolio_urls: ['https://example.com/portfolio'],
        status: appStatuses[(appCount + i) % appStatuses.length],
      });
      appCount++;
    }
    await camp.update({ applications_count: 3 });
  }

  // ── Partnerships + deliverables ─────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const camp = campaigns[i]; const cr = creators[i];
    const p = await db.Partnership.create({
      campaign_id: camp.id, brand_id: brand.id, influencer_id: cr.id, title: `${cr.display_name} × ${camp.title}`,
      description: 'Signed partnership', agreed_rate: cr.rate_per_post, currency: 'INR', start_date: d(-5), end_date: d(25),
      status: i === 2 ? 'completed' : 'active', payment_status: i === 2 ? 'paid' : 'pending', paid_at: i === 2 ? new Date() : null,
    });
    await db.Deliverable.create({
      partnership_id: p.id, title: 'Launch Reel', description: '30s reel', platform: 'Instagram', deliverable_type: 'reel',
      due_date: d(10), status: i === 2 ? 'approved' : 'pending', content_url: i === 2 ? 'https://example.com/reel' : null,
      performance_metrics: i === 2 ? { views: 120000, likes: 9800, comments: 540 } : {},
    });
  }

  // ── CRM: leads → deals → proposals → payments ────────────────────────────────────
  const leadsData = [
    { company: 'NovaTech', niche: 'Tech & Gadgets', email: 'hello@novatech.io', score: 88, priority: 'high', status: 'booked' },
    { company: 'GlowUp Cosmetics', niche: 'Beauty', email: 'partners@glowup.com', score: 72, priority: 'medium', status: 'contacted' },
    { company: 'FitFuel', niche: 'Fitness & Wellness', email: 'biz@fitfuel.co', score: 65, priority: 'medium', status: 'new' },
    { company: 'Wanderlust Travel', niche: 'Travel & Adventure', email: 'collab@wanderlust.com', score: 91, priority: 'high', status: 'booked' },
    { company: 'TastyBox', niche: 'Food & Cooking', email: 'hi@tastybox.in', score: 58, priority: 'low', status: 'new' },
    { company: 'PixelPlay', niche: 'Gaming', email: 'sponsor@pixelplay.gg', score: 79, priority: 'high', status: 'contacted' },
  ];
  const leads = [];
  for (const l of leadsData) {
    leads.push(await db.Lead.create({
      company_name: l.company, niche: l.niche, email: l.email, instagram_handle: '@' + l.company.toLowerCase().replace(/\s/g, ''),
      website: `https://${l.company.toLowerCase().replace(/\s/g, '')}.com`, score: l.score, priority: l.priority,
      score_breakdown: { audience: l.score - 5, engagement: l.score, relevance: l.score + 3 }, status: l.status,
      org_id: ORG, last_scored_at: new Date(),
    }));
  }
  const stages = ['qualified', 'negotiation', 'closed_won', 'closed_lost'];
  const deals = [];
  for (let i = 0; i < 4; i++) {
    const l = leads[i];
    deals.push(await db.Deal.create({
      lead_id: l.id, company_name: l.company_name, value: 300000 + i * 250000, stage: stages[i], source: 'manual', org_id: ORG,
    }));
  }
  const proposals = [];
  for (let i = 0; i < 3; i++) {
    const dl = deals[i];
    proposals.push(await db.Proposal.create({
      deal_id: dl.id, company_name: dl.company_name, total_price: dl.value, status: i === 0 ? 'approved' : 'sent',
      deliverables: ['3 reels', '5 stories'], pricing_breakdown: { content: dl.value * 0.7, management: dl.value * 0.3 },
      notes: 'Standard partnership package', org_id: ORG,
    }));
  }
  for (let i = 0; i < 3; i++) {
    await db.Payment.create({
      proposal_id: proposals[i].id, deal_id: deals[i].id, company_name: deals[i].company_name,
      amount: proposals[i].total_price, status: i === 0 ? 'paid' : i === 1 ? 'pending' : 'escrow',
      method: 'upi', transaction_id: 'txn_' + Math.random().toString(36).slice(2, 12), org_id: ORG,
    });
  }

  // ── Billing: plans (global) + subscription + invoices ───────────────────────────
  const planCount = await db.Plan.count();
  let proPlan;
  if (planCount === 0) {
    await db.Plan.create({ name: 'Starter', description: 'For small brands', monthly_price: 0, annual_price: 0, commission: 10, features: ['5 campaigns', 'Basic analytics'], limits: { campaigns: 5 }, is_active: true });
    proPlan = await db.Plan.create({ name: 'Pro', description: 'Growing brands', monthly_price: 4999, annual_price: 49990, commission: 7, features: ['Unlimited campaigns', 'AI matching', 'Priority support'], limits: { campaigns: -1 }, is_active: true });
    await db.Plan.create({ name: 'Enterprise', description: 'Agencies & large brands', monthly_price: 19999, annual_price: 199990, commission: 5, features: ['Everything in Pro', 'Dedicated CSM', 'API access'], limits: { campaigns: -1 }, is_active: true });
  } else {
    proPlan = await db.Plan.findOne({ where: { name: 'Pro' } }) || await db.Plan.findOne();
  }
  const sub = await db.Subscription.create({
    org_id: ORG, plan_id: proPlan ? proPlan.id : null, status: 'active',
    current_period_start: d(-5), current_period_end: d(25), cancel_at_period_end: false,
  });
  for (let i = 0; i < 3; i++) {
    await db.Invoice.create({ org_id: ORG, subscription_id: sub.id, amount: 4999, currency: 'INR', status: i === 0 ? 'paid' : 'paid', plan_name: 'Pro' });
  }

  // ── Notifications ────────────────────────────────────────────────────────────────
  const notifs = [
    { type: 'campaign', title: 'New application', message: 'Aisha Khan applied to Summer Tech Launch' },
    { type: 'payment', title: 'Payment received', message: '₹3,00,000 from NovaTech cleared' },
    { type: 'deal', title: 'Deal won', message: 'NovaTech deal moved to Won' },
    { type: 'system', title: 'Welcome to Baalvion Connect', message: 'Your workspace is ready.' },
    { type: 'alert', title: 'Dispute opened', message: 'A creator opened a dispute on Festive Fashion Edit' },
  ];
  for (const n of notifs) {
    await db.Notification.create({ user_id: USER, org_id: ORG, title: n.title, message: n.message, read: false, type: n.type, link: '/admin' });
  }

  // ── Disputes ───────────────────────────────────────────────────────────────────
  await db.Dispute.create({ campaign_id: campaigns[2].id, creator_id: creators[0].id, brand_id: brand.id, category: 'content', reason: 'Deliverable did not match brief', proposed_resolution: 'Re-shoot or partial refund', evidence_urls: [], status: 'filed' });
  await db.Dispute.create({ campaign_id: campaigns[0].id, creator_id: creators[1].id, brand_id: brand.id, category: 'payment', reason: 'Payment delayed', proposed_resolution: 'Release escrow', evidence_urls: [], status: 'resolved', admin_notes: 'Escrow released after review.' });

  // ── System logs (audit) ──────────────────────────────────────────────────────────
  for (const ev of ['user.login', 'campaign.created', 'payment.completed', 'creator.shortlisted', 'plan.subscribed']) {
    await db.SystemLog.create({ org_id: ORG, event: ev, message: `${ev} by Brand Admin`, metadata: { user_id: USER } });
  }

  console.log('Seed complete:', { brand: brand.id, creators: creators.length, campaigns: campaigns.length, applications: appCount, leads: leads.length, deals: deals.length });
  process.exit(0);
})().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
