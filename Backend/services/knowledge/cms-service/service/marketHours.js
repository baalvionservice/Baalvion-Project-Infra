'use strict';
// Session-hours-only market status (no holiday calendar — a closed session on a
// listed holiday will incorrectly read "open"). Good enough for a dashboard status
// badge; a real trading system would need a holiday calendar per exchange.
const EXCHANGES = {
    NYSE: {
        name: 'NYSE', timeZone: 'America/New_York',
        preMarket: [4, 0], open: [9, 30], close: [16, 0], afterHours: [20, 0],
    },
    NASDAQ: {
        name: 'NASDAQ', timeZone: 'America/New_York',
        preMarket: [4, 0], open: [9, 30], close: [16, 0], afterHours: [20, 0],
    },
    LSE: { name: 'London', timeZone: 'Europe/London', open: [8, 0], close: [16, 30] },
    TSE: { name: 'Tokyo', timeZone: 'Asia/Tokyo', open: [9, 0], close: [15, 0] },
};

function partsInZone(timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23', weekday: 'short', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return { weekday: get('weekday'), hour: Number(get('hour')), minute: Number(get('minute')) };
}

const toMin = ([h, m]) => h * 60 + m;

// Returns 'open' | 'pre-market' | 'after-hours' | 'closed'. Exchanges without
// defined pre/after-hours windows (LSE, TSE) only ever report 'open'/'closed'.
function getExchangeStatus(code) {
    const ex = EXCHANGES[code];
    if (!ex) return null;
    const { weekday, hour, minute } = partsInZone(ex.timeZone);
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const nowMin = hour * 60 + minute;
    const openMin = toMin(ex.open);
    const closeMin = toMin(ex.close);

    let status = 'closed';
    if (!isWeekend) {
        if (nowMin >= openMin && nowMin < closeMin) status = 'open';
        else if (ex.preMarket && nowMin >= toMin(ex.preMarket) && nowMin < openMin) status = 'pre-market';
        else if (ex.afterHours && nowMin >= closeMin && nowMin < toMin(ex.afterHours)) status = 'after-hours';
    }
    return { code, name: ex.name, isOpen: status === 'open', status };
}

function getAllExchangeStatuses() {
    return Object.keys(EXCHANGES).map((code) => getExchangeStatus(code));
}

// Per-asset-type status, used on individual /quote pages. Crypto trades 24/7;
// forex/commodities/bonds don't have one single retail session, so NYSE hours are
// used as a reasonable approximation (documented limitation, not exact for FX).
function getAssetMarketStatus(assetType) {
    if (assetType === 'crypto') return { status: 'open', isOpen: true, label: '24/7' };
    if (assetType === 'forex') {
        const { weekday } = partsInZone('America/New_York');
        const isWeekend = weekday === 'Sat' || weekday === 'Sun';
        return isWeekend
            ? { status: 'closed', isOpen: false, label: 'Closed' }
            : { status: 'open', isOpen: true, label: 'Open' };
    }
    const nyse = getExchangeStatus('NYSE');
    return { status: nyse.status, isOpen: nyse.isOpen, label: nyse.status };
}

module.exports = { getExchangeStatus, getAllExchangeStatuses, getAssetMarketStatus };
