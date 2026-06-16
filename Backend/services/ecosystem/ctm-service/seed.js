'use strict';
// Idempotent seed for reference data the frontend depends on:
//   - plans  (pricing page + free-plan auto-provision in auth-context)
//   - badges (public /badges page + candidate profiles)
// Safe to run repeatedly: upserts by natural key (plan.slug, badge.name).
//   node seed.js
const db = require('./models');

// NOTE: plan names + prices here are the SERVER-AUTHORITATIVE source for checkout — they must
// match the tiers shown on the /pricing page (the page resolves a plan_id by name and the charge
// is computed from these prices). 'free' stays as the implicit auto-provisioned signup tier.
const PLANS = [
    {
        slug: 'free', name: 'Free',
        description: 'For individuals getting started.',
        monthly_price: 0, annual_price: 0, currency: 'USD',
        features: ['1 Active Task', '3 Submissions per month', 'Basic Analytics'],
        max_tasks: 1, max_team_size: 1, is_active: true,
    },
    {
        slug: 'basic', name: 'Basic',
        description: 'For individuals and small teams getting started.',
        monthly_price: 29, annual_price: 290, currency: 'USD',
        features: ['50 Active Tasks', '100 Candidates per month', 'Basic Analytics', 'Email Support'],
        max_tasks: 50, max_team_size: 3, is_active: true,
    },
    {
        slug: 'pro', name: 'Pro',
        description: 'For growing teams that hire often.',
        monthly_price: 79, annual_price: 790, currency: 'USD',
        features: ['50 Active Tasks', '1,000 Candidates per month', 'Advanced Analytics', 'Priority Email Support', 'AI Task Assistant'],
        max_tasks: 50, max_team_size: 10, is_active: true,
    },
    {
        slug: 'business', name: 'Business',
        description: 'For scaling teams that need collaboration, API access and priority support.',
        monthly_price: 185, annual_price: 1850, currency: 'USD',
        features: ['Unlimited Active Tasks', '5,000 Candidates per month', 'Advanced Analytics & custom reports', 'AI Task Assistant', 'Team collaboration & roles', 'API access', 'Priority support'],
        max_tasks: null, max_team_size: 50, is_active: true,
    },
    {
        slug: 'enterprise', name: 'Enterprise',
        description: 'Custom scale, security and support.',
        monthly_price: 0, annual_price: 0, currency: 'USD',
        features: ['Unlimited Everything', 'Custom Integrations', 'Dedicated Support'],
        max_tasks: null, max_team_size: null, is_active: true,
    },
];

const BADGES = [
    { name: 'Top 10 Performer', description: 'Achieved a ranking in the top 10% of all candidates.', icon: 'Trophy', rarity: 'Elite', criteria: { type: 'ranking_percentile', value: 10 } },
    { name: 'Verified Talent', description: 'Manually verified by the SkillMatch Pro team for exceptional skill.', icon: 'ShieldCheck', rarity: 'Elite', criteria: { type: 'manual_verification' } },
    { name: 'Quick Starter', description: 'Completed the first assigned task within 24 hours.', icon: 'Rocket', rarity: 'Rare', criteria: { type: 'first_task_hours', value: 24 } },
    { name: 'Specialist', description: 'Completed 5 tasks within the same role category.', icon: 'Award', rarity: 'Rare', criteria: { type: 'category_completions', value: 5 } },
    { name: 'Problem Solver', description: 'Achieved a score of 90+ on a task of Advanced or Expert difficulty.', icon: 'BrainCircuit', rarity: 'Common', criteria: { type: 'high_score_hard', value: 90 } },
];

async function run() {
    await db.sequelize.authenticate();
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ctm');
    await db.sequelize.sync({ alter: false });

    let plansCreated = 0;
    for (const p of PLANS) {
        const [, created] = await db.plans.findOrCreate({ where: { slug: p.slug }, defaults: p });
        if (created) plansCreated++;
    }

    let badgesCreated = 0;
    for (const b of BADGES) {
        const [, created] = await db.badges.findOrCreate({ where: { name: b.name }, defaults: b });
        if (created) badgesCreated++;
    }

    const [planCount, badgeCount] = await Promise.all([db.plans.count(), db.badges.count()]);
    console.log(`[seed] plans: +${plansCreated} new (total ${planCount}) | badges: +${badgesCreated} new (total ${badgeCount})`);
    await db.sequelize.close();
}

run().catch((err) => { console.error('[seed] failed:', err.message); process.exit(1); });
