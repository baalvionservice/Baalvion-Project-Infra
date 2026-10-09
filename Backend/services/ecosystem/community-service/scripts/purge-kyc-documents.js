'use strict';
// Deletes encrypted ID scans/selfies for decided KYC cases older than KYC_DOC_RETENTION_DAYS
// (default 90). Run daily from cron/pm2. The decision and audit trail are kept.
require('dotenv').config();
const db = require('../models');
const { purgeDecidedDocuments } = require('../service/kycService');

(async () => {
    const days = Number(process.env.KYC_DOC_RETENTION_DAYS || 90);
    const n = await purgeDecidedDocuments(days);
    console.log(JSON.stringify({ purged: n, retentionDays: days }));
    await db.sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
