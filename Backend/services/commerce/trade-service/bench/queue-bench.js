'use strict';
// Real queue throughput benchmark: enqueue N jobs and measure drain time.
//   node bench/queue-bench.js [count]
const queue = require('../queue');
const db = require('../models');

const COUNT = Number(process.argv[2] || 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const q = queue.q('sms');
    await q.drain(true).catch(() => {});
    const startCounts = await q.getJobCounts('completed');
    const base = startCounts.completed || 0;

    const tEnqueue = Date.now();
    const jobs = [];
    for (let i = 0; i < COUNT; i += 1) jobs.push(queue.enqueue('sms', 'send', { to: `+1555${i}`, body: 'bench', tenantId: 'T-DEMO' }));
    await Promise.all(jobs);
    const enqMs = Date.now() - tEnqueue;

    const tDrain = Date.now();
    let processed = 0;
    while (processed < COUNT && Date.now() - tDrain < 60000) {
        await sleep(100);
        const c = await q.getJobCounts('completed');
        processed = (c.completed || 0) - base;
    }
    const drainMs = Date.now() - tDrain;

    console.log(`\nQueue throughput bench (sms, ${COUNT} jobs, worker concurrency 5)`);
    console.log('='.repeat(56));
    console.log(`enqueue:  ${COUNT} jobs in ${enqMs}ms  -> ${(COUNT / (enqMs / 1000)).toFixed(0)} jobs/s`);
    console.log(`process:  ${processed}/${COUNT} drained in ${drainMs}ms -> ${(processed / (drainMs / 1000)).toFixed(0)} jobs/s`);

    // cleanup bench delivery records
    await db.Collection.destroy({ where: { collection: 'notification_deliveries' } }).catch(() => {});
    process.exit(0);
})();
