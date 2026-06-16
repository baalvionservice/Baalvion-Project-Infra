'use strict';
// Sync view metrics. ONLINE figures are computed live from real transactions; OFFLINE figures come
// from the sync_offline_snapshots table (no live POS feed yet); conflicts come from sync_conflicts.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Payment gateways that originate on the web vs in-app, used to split the online channel mix.
const WEB_GATEWAYS = new Set(['stripe', 'razorpay', 'paypal', 'payu', 'website', 'web']);
const round2 = (n) => Number((Number(n) || 0).toFixed(2));
const iso = (v) => (v == null ? null : new Date(v).toISOString());

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function computeOnline(transactions) {
    const now = new Date();
    // Last 7 calendar days, oldest → newest.
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
        const day = startOfDay(now);
        day.setDate(day.getDate() - i);
        buckets.push({ key: day.getTime(), day: WEEKDAYS[day.getDay()], revenue: 0, orders: 0 });
    }
    const bucketFor = (ts) => {
        const k = startOfDay(ts).getTime();
        return buckets.find((b) => b.key === k);
    };

    let webCount = 0;
    let appCount = 0;
    for (const t of transactions) {
        const amt = Number(t.amount || 0);
        // Auto-timestamp attribute is camelCase even with underscored columns; tolerate both.
        const b = bucketFor(t.createdAt ?? t.created_at);
        if (b) { b.revenue += amt; b.orders += 1; }
        if (WEB_GATEWAYS.has(String(t.gateway || '').toLowerCase())) webCount += 1; else appCount += 1;
    }

    // "Today" = latest day with activity (keeps the card meaningful when nothing posted yet today).
    let today = buckets[buckets.length - 1];
    if (today.orders === 0) {
        const active = [...buckets].reverse().find((b) => b.orders > 0);
        if (active) today = active;
    }

    const totalChannel = webCount + appCount;
    const website = totalChannel ? Math.round((webCount / totalChannel) * 100) : 62;

    return {
        todaysRevenue: round2(today.revenue),
        ordersToday: today.orders,
        avgOrderValue: today.orders ? round2(today.revenue / today.orders) : 0,
        topChannels: { website, app: 100 - website },
        revenueLast7Days: buckets.map((b) => ({ day: b.day, revenue: round2(b.revenue) })),
    };
}

async function computeSync(db, orgId) {
    const [transactions, offlineRow, conflicts] = await Promise.all([
        db.Transaction.findAll({ where: { org_id: orgId }, raw: true }),
        db.SyncOfflineSnapshot.findOne({ where: { org_id: orgId }, raw: true }),
        db.SyncConflict.findAll({ where: { org_id: orgId }, order: [['detected_at', 'DESC']], raw: true }),
    ]);

    const online = computeOnline(transactions);

    const offline = offlineRow
        ? {
            todaysRevenue: round2(offlineRow.todays_revenue),
            walkInCustomers: offlineRow.walk_in_customers || 0,
            avgTransaction: round2(offlineRow.avg_transaction),
            topStore: offlineRow.top_store || {},
            revenueLast7Days: offlineRow.revenue_last_7_days || [],
        }
        : { todaysRevenue: 0, walkInCustomers: 0, avgTransaction: 0, topStore: {}, revenueLast7Days: [] };

    const openConflicts = conflicts.filter((c) => !c.resolved).map((c) => ({
        id: c.conflict_key,
        businessId: c.business_id,
        field: c.field,
        offlineValue: c.offline_value,
        onlineValue: c.online_value,
        detectedAt: iso(c.detected_at),
    }));

    const resolvedConflicts = conflicts.filter((c) => c.resolved).map((c) => ({
        id: c.conflict_key,
        field: c.field,
        businessId: c.business_id,
        resolvedBy: c.resolved_by,
        resolvedAt: iso(c.resolved_at),
        action: c.action,
    }));

    return { online, offline, conflicts: openConflicts, resolvedConflicts };
}

module.exports = { computeSync };
