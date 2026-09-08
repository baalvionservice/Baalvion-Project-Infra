'use strict';

/**
 * Seeds a starting editorial charter + publication policy for each site.
 *
 * These are drafts for an editor to argue with, not settled policy -- every
 * field is editable in the admin panel, and the whole point of the charter is
 * that a human decides what the publication sounds like. They are seeded because
 * the pipeline refuses to run without one, and an empty form is a worse starting
 * point than a considered one.
 *
 * Idempotent: re-running updates the row in place. Category mixes reference the
 * slugs that exist in THIS database -- a site whose production taxonomy differs
 * needs its mix re-set in the UI (mix entries naming a missing category are
 * simply never filled by the planner).
 *
 *   node scripts/seed-editorial-charters.cjs [--force]
 *
 * Without --force an existing charter is left untouched, so a hand-edited
 * charter is never silently reverted by a re-run.
 */

require('dotenv').config();
const db = require('../models');
const charterService = require('../service/editorial/charterService');
const policyService = require('../service/editorial/policyService');

const FORCE = process.argv.includes('--force');

const CHARTERS = {
    imperialpedia: {
        charter: {
            niche: 'Money, markets and the economy — explained for people making their own financial decisions.',
            audience:
                'Self-directed retail investors and financially engaged general readers, mostly in the US, who manage their own brokerage or retirement accounts and want to know what a headline actually means for their money.',
            houseAngle:
                'Every story is read through one question: what does this change for an ordinary person\'s money? We work from primary documents — Fed statements, SEC filings, BLS releases, company filings — in preference to secondhand wire copy. We quantify wherever a real number exists, we name the mechanism rather than the mood, and when the honest answer is "nothing yet, and here is what would have to happen first", we say that instead of manufacturing an implication. We do not forecast prices, tip stocks, or write about market moves as though they were weather.',
            voice:
                'Plain English. Short sentences. Every piece of jargon defined the first time it appears. Numbers always carry their unit and their source. Second person where it genuinely helps the reader act. No hype, no urgency the facts do not support, no rhetorical questions as headlines.',
            covers: [
                'federal reserve', 'interest rates', 'rate cut', 'rate hike', 'inflation', 'cpi', 'monetary policy',
                'treasury', 'bond yields', 'recession', 'gdp', 'unemployment', 'jobs report', 'labor market',
                'stock market', 'earnings', 'sec', 'securities and exchange commission', 'ipo', 'dividend',
                'index fund', 'etf', 'mutual fund', 'brokerage', '401k', 'ira', 'retirement',
                'mortgage', 'mortgage rates', 'housing market', 'credit card', 'credit score', 'student loans',
                'personal finance', 'savings account', 'consumer prices', 'tariffs', 'banking', 'bank failure',
                'fdic', 'cfpb', 'consumer financial protection bureau', 'tax', 'irs', 'social security',
                'cryptocurrency', 'bitcoin', 'stablecoin', 'central bank',
            ],
            // Wire categories that are genuinely this site's beat. A single
            // charter-term hit from one of these counts as a real signal; the
            // same hit from anywhere else needs a second term to corroborate it.
            wireCategories: ['Finance', 'Business'],
            excludes: [
                'celebrity', 'gossip', 'red carpet', 'box office', 'movie review', 'tv review',
                'sports', 'nfl', 'nba', 'football', 'soccer', 'olympics', 'stadium',
                'video game', 'gaming console', 'recipe', 'horoscope', 'royal family',
            ],
            stanceRules: [
                'Never give individual investment advice. Explain mechanisms and trade-offs; the reader decides.',
                'Never forecast a price or an index level. Report what is known and what would have to be true.',
                'Attribute every number to the body that published it, by name, in the sentence that uses it.',
                'Where a claim is contested, give both readings and say which sources back each.',
                'Disclose when Baalvion or an affiliate has an interest in a company under discussion.',
            ],
            bannedClaims: [
                'guaranteed returns', 'risk-free return', 'can\'t lose', 'cannot lose', 'sure thing',
                'get rich', 'guaranteed profit', 'will definitely', 'is certain to', 'no downside',
                'this stock will', 'experts agree', 'studies show',
            ],
            requiredSections: [
                'What happened',
                'Why it matters for your money',
                'The numbers',
                'What we don\'t know yet',
            ],
            minSources: 2,
            maxSimilarityPct: 18,
            minCitationCoveragePct: 75,
            requireQuoteVerification: true,
        },
        policy: {
            dailyTarget: 6,
            dailyMax: 10,
            hourlyMax: 2,
            minMinutesBetweenPosts: 45,
            weekendTargetPct: 40,
            categoryMix: [
                { categorySlug: 'economy', label: 'Economy', targetPct: 30, minPerDay: 1, maxPerDay: 4 },
                { categorySlug: 'stocks', label: 'Stocks & Markets', targetPct: 30, minPerDay: 1, maxPerDay: 4 },
                { categorySlug: 'personal-finance', label: 'Personal Finance', targetPct: 25, minPerDay: 1, maxPerDay: 3 },
                { categorySlug: 'credit-cards', label: 'Credit Cards', targetPct: 15, minPerDay: 0, maxPerDay: 2 },
            ],
            formatMix: [
                { format: 'news', targetPct: 60 },
                { format: 'analysis', targetPct: 25 },
                { format: 'explainer', targetPct: 15 },
            ],
            // Weekdays 12:00-21:00 UTC covers the US market day; a light weekend window.
            publishWindows: [
                { label: 'US market day', startHourUtc: 12, endHourUtc: 21, days: [1, 2, 3, 4, 5] },
                { label: 'Weekend digest', startHourUtc: 14, endHourUtc: 18, days: [6, 7] },
            ],
            wordCountRules: [
                { format: 'news', min: 350, max: 750 },
                { format: 'analysis', min: 700, max: 1400 },
                { format: 'explainer', min: 600, max: 1600 },
            ],
            requireOriginalArt: true,
            requireReviewerDistinctFromAuthor: true,
            maxArticlesPerAuthorPerDay: 2,
            correctionsPolicyUrl: '/corrections',
            correctionWindowHours: 24,
            staleAfterDays: 180,
            requireUpdateNote: true,
        },
    },

    'law-elite-network': {
        charter: {
            niche: 'US legal news for the people it lands on — consumers, employees and small businesses — not for lawyers.',
            audience:
                'People in the United States dealing with a legal situation and trying to understand their position before, or instead of, hiring a lawyer: an employee facing dismissal, a family in a custody dispute, a small business served with a claim.',
            houseAngle:
                'A ruling, a rule change or an enforcement action is only news here if it changes what an ordinary person can or must do. We start from the primary document — the opinion, the agency order, the recall notice — and translate it into rights, deadlines and next steps. We are explicit that law varies by state and that limitation periods run. We never imply an outcome, and we never write anything that reads as advice for a specific person\'s case.',
            voice:
                'Direct and calm. No Latin without an immediate plain-English gloss. Deadlines and dollar figures stated exactly. Every piece makes clear what it is not: general information, not legal advice for the reader\'s own situation.',
            covers: [
                'supreme court', 'scotus', 'appeals court', 'circuit court', 'federal court', 'ruling', 'opinion',
                'lawsuit', 'class action', 'settlement', 'verdict', 'damages', 'liability', 'negligence',
                'personal injury', 'wrongful death', 'product liability', 'recall', 'defect', 'safety warning',
                'employment law', 'wrongful termination', 'discrimination', 'harassment', 'overtime', 'wage theft',
                'eeoc', 'nlrb', 'osha', 'workers compensation',
                'family law', 'divorce', 'custody', 'child support', 'alimony',
                'consumer protection', 'ftc', 'cfpb', 'fraud', 'deceptive practices', 'data breach', 'privacy',
                'department of justice', 'attorney general', 'indictment', 'enforcement action', 'consent decree',
                'intellectual property', 'copyright', 'trademark', 'patent',
                'statute of limitations', 'small business', 'contract dispute', 'landlord', 'tenant', 'eviction',
            ],
            wireCategories: ['Legal'],
            excludes: [
                'celebrity', 'gossip', 'red carpet', 'box office',
                'sports', 'nfl', 'nba', 'football', 'soccer', 'olympics',
                'video game', 'gaming console', 'recipe', 'horoscope', 'royal family',
                'true crime', 'murder mystery',
            ],
            stanceRules: [
                'Never give legal advice for a specific situation. Explain the rule and what it generally means.',
                'Always state that the law varies by state and that time limits apply.',
                'Never predict how a case will come out, and never imply a likely payout.',
                'Name the court, the agency and the docket or release the piece is built on.',
                'Where a story involves an ongoing case, say plainly that nothing is decided yet.',
            ],
            bannedClaims: [
                'guaranteed compensation', 'you will receive', 'we will win', 'you are entitled to',
                'sure to win', 'easy claim', 'no risk', 'guaranteed settlement', 'maximum compensation',
                'you have a strong case', 'experts agree',
            ],
            requiredSections: [
                'What happened',
                'Who this affects',
                'What the law actually says',
                'What to do next',
                'When to talk to a lawyer',
            ],
            minSources: 2,
            // Legal writing quotes statute and opinion text, which legitimately
            // raises overlap with the source document. A slightly higher ceiling
            // than Imperialpedia's, still far below paraphrase territory.
            maxSimilarityPct: 22,
            minCitationCoveragePct: 80,
            requireQuoteVerification: true,
        },
        policy: {
            dailyTarget: 4,
            dailyMax: 7,
            hourlyMax: 2,
            minMinutesBetweenPosts: 60,
            weekendTargetPct: 25,
            categoryMix: [
                { categorySlug: 'employment-law', label: 'Employment Law', targetPct: 35, minPerDay: 1, maxPerDay: 3 },
                { categorySlug: 'business', label: 'Business & Consumer', targetPct: 30, minPerDay: 1, maxPerDay: 3 },
                { categorySlug: 'family-law', label: 'Family Law', targetPct: 20, minPerDay: 0, maxPerDay: 2 },
                { categorySlug: 'tech-ip', label: 'Tech & IP', targetPct: 15, minPerDay: 0, maxPerDay: 2 },
            ],
            formatMix: [
                { format: 'news', targetPct: 50 },
                { format: 'explainer', targetPct: 35 },
                { format: 'analysis', targetPct: 15 },
            ],
            publishWindows: [
                { label: 'US business day', startHourUtc: 13, endHourUtc: 22, days: [1, 2, 3, 4, 5] },
            ],
            wordCountRules: [
                { format: 'news', min: 400, max: 800 },
                { format: 'explainer', min: 700, max: 1600 },
                { format: 'analysis', min: 700, max: 1400 },
            ],
            requireOriginalArt: true,
            requireReviewerDistinctFromAuthor: true,
            maxArticlesPerAuthorPerDay: 2,
            correctionsPolicyUrl: '/corrections',
            correctionWindowHours: 24,
            staleAfterDays: 365,
            requireUpdateNote: true,
        },
    },
};

async function main() {
    await db.sequelize.authenticate();
    for (const [slug, spec] of Object.entries(CHARTERS)) {
        const site = await db.CmsWebsite.findOne({ where: { slug } });
        if (!site) { console.log(`- ${slug}: not registered in this database, skipped`); continue; }

        const existingCharter = await charterService.getCharter(site.id);
        if (existingCharter && !FORCE) {
            console.log(`- ${slug}: charter already exists (use --force to overwrite)`);
        } else {
            await charterService.upsertCharter(site.id, spec.charter, null);
            console.log(`- ${slug}: charter ${existingCharter ? 'updated' : 'created'}`);
        }

        const existingPolicy = await policyService.getPolicy(site.id);
        if (existingPolicy && !FORCE) {
            console.log(`- ${slug}: publication policy already exists (use --force to overwrite)`);
        } else {
            await policyService.upsertPolicy(site.id, spec.policy, null);
            console.log(`- ${slug}: publication policy ${existingPolicy ? 'updated' : 'created'}`);
        }
    }
    await db.sequelize.close();
}

main().catch((err) => { console.error('seed failed:', err.message); process.exit(1); });
