'use strict';
// Seeds the three tasks that used to be hard-coded in the frontend. They go in as DRAFTS:
// each one invites testing of the live login/checkout/session code, so publishing is a
// deliberate admin action (after the scope and rules text is written), never a side effect.
require('dotenv').config();
const db = require('../models');

const TASKS = [
    { title: 'Login Field Injection', target: '/auth/signin', difficulty: 'MEDIUM', reward_label: '$50 BTC',
      description: 'Find an SQL or NoSQL injection vector in the authentication endpoint. Bypass login without valid credentials.' },
    { title: 'Marketplace Cart Bypass', target: '/marketplace → Checkout', difficulty: 'HARD', reward_label: '$150 BTC',
      description: 'Modify cart item prices or skip payment validation. Achieve checkout without a valid payment intent.' },
    { title: 'Session Token Hijack', target: 'Any authenticated route', difficulty: 'EXPERT', reward_label: '$300 BTC',
      description: 'Extract or forge a session/JWT token to impersonate another user or escalate to admin role.' },
];

async function main() {
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS community');
    await db.sequelize.sync({ alter: false });
    let created = 0;
    for (const t of TASKS) {
        const [, isNew] = await db.BountyTask.findOrCreate({ where: { title: t.title }, defaults: { ...t, status: 'draft' } });
        if (isNew) created += 1;
    }
    console.log(JSON.stringify({ tasks: { seeded: created, total: TASKS.length } }));
    await db.sequelize.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
