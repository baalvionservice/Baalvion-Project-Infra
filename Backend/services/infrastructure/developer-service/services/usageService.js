'use strict';

// Reports real API usage for an org's keys. news-service tracks daily request counts in
// Redis (news:quota:{keyId}:{YYYY-MM-DD}, see news-service/middleware/quota.js) and both
// services point at the same Redis instance in every deployed environment (identical
// REDIS_HOST/PORT/PASSWORD config) — so this reads those counters directly rather than
// standing up a second HTTP hop for what's already a shared cache.

const db = require('../models');
const redisConfig = require('../config/redis');

const QUOTA_PREFIX = 'news:quota:';

function utcDateKeysForMonthToDate(now = new Date()) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const daysSoFar = now.getUTCDate();
    const keys = [];
    for (let day = 1; day <= daysSoFar; day += 1) {
        keys.push(new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10));
    }
    return keys;
}

async function getUsageForOrg(orgId) {
    const keyRows = await db.ApiKey.findAll({ where: { org_id: orgId, status: 'active' } });
    const dateKeys = utcDateKeysForMonthToDate();
    const redisAvailable = redisConfig.isAvailable();
    const redis = redisConfig.getClient();

    const orgDailyTotals = new Map(dateKeys.map((day) => [day, 0]));

    const perKey = await Promise.all(
        keyRows.map(async (row) => {
            let monthToDate = 0;
            let usedToday = 0;
            if (redisAvailable && redis) {
                const counts = await Promise.all(
                    dateKeys.map((day) => redis.get(`${QUOTA_PREFIX}${row.id}:${day}`).catch(() => null))
                );
                counts.forEach((value, index) => {
                    const n = Number(value) || 0;
                    const day = dateKeys[index];
                    monthToDate += n;
                    orgDailyTotals.set(day, (orgDailyTotals.get(day) || 0) + n);
                    if (index === counts.length - 1) usedToday = n;
                });
            }
            return {
                keyId: row.id,
                name: row.name,
                mode: row.mode,
                last4: row.last4,
                scopes: row.scopes || [],
                usedToday,
                monthToDate,
            };
        })
    );

    return {
        month: new Date().toISOString().slice(0, 7),
        redisAvailable,
        keys: perKey,
        totalMonthToDate: perKey.reduce((sum, k) => sum + k.monthToDate, 0),
        totalToday: perKey.reduce((sum, k) => sum + k.usedToday, 0),
        dailySeries: dateKeys.map((day) => ({ day, requests: orgDailyTotals.get(day) || 0 })),
    };
}

module.exports = { getUsageForOrg };
