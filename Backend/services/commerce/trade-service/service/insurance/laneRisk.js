'use strict';
/**
 * Lane risk multiplier for cargo underwriting.
 *
 * The first version measured a lane's own loss frequency and, below a 25-shipment
 * threshold, gave up and returned the flat base rate. On a young book that meant
 * the engine was inert: every quote came back ×1 no matter how the lane behaved,
 * and the moment a lane crossed the threshold its price would jump discontinuously.
 *
 * This uses limited-fluctuation credibility instead — the standard actuarial answer
 * to "not enough data". The lane's observed frequency is blended with the whole
 * book's, weighted by how much the lane's own sample is worth:
 *
 *     Z = n / (n + K)                          (K = the sample that earns half weight)
 *     blended = Z · laneFrequency + (1 − Z) · bookFrequency
 *
 * One shipment nudges the rate; two hundred nearly determine it; nothing jumps. The
 * response always carries Z and both sample sizes, so a quote can state exactly how
 * much of its price came from this lane and how much from the book — never a
 * confident-looking number standing on three shipments.
 *
 * Resolution ladder, widening until a sample exists: port pair → country pair →
 * whole book → base rate (a genuinely empty platform, which is disclosed as such).
 *
 * The commodity/duration loadings below are this platform's own published rating
 * factors (same status as providers/insurance.js RATES); a real underwriter
 * replaces both behind this seam.
 */
const { Op } = require('sequelize');
const db = require('../../models');

const LOOKBACK_MONTHS = 24;
// Sample size at which a lane's own experience carries half the weight. Marine
// cargo frequencies are low, so this is deliberately generous: a handful of voyages
// should inform a price, not dictate it.
const HALF_CREDIBILITY_SAMPLE = 60;
const INSURABLE_TYPES = ['damage', 'loss', 'theft', 'accident'];
const SEVERITIES = ['high', 'critical'];

// A 1-in-100 blended loss frequency prices at 1.5× base. The cap keeps one bad
// quarter on a thin lane from producing an unsellable premium.
const FREQUENCY_WEIGHT = 50;
const MAX_LANE_MULTIPLIER = 3;

// Container types whose cargo carries a structurally different loss profile:
// reefers fail on power/temperature, tanks and open-tops on containment/exposure.
const CONTAINER_FACTORS = { reefer: 1.35, tank: 1.25, open_top: 1.2, flat_rack: 1.2 };

// Exposure scales with time at sea; expressed per 30 days beyond a 30-day voyage.
const TRANSIT_FACTOR_PER_MONTH = 0.05;
const MAX_TRANSIT_FACTOR = 1.25;

const round = (n, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

function sinceDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - LOOKBACK_MONTHS);
    return d;
}

/** Shipments carried and qualifying losses suffered within one geography scope. */
async function measure(where, scope) {
    const shipments = await db.TradeShipment.findAll({
        where: { ...where, created_at: { [Op.gte]: sinceDate() } },
        attributes: ['id'],
        raw: true,
        limit: 20000,
    });
    if (!shipments.length) return { scope, sampleSize: 0, incidents: 0, frequency: 0 };

    const incidents = await db.Incident.count({
        where: {
            shipment_id: { [Op.in]: shipments.map((s) => s.id) },
            incident_type: { [Op.in]: INSURABLE_TYPES },
            severity: { [Op.in]: SEVERITIES },
        },
    });
    return { scope, sampleSize: shipments.length, incidents, frequency: incidents / shipments.length };
}

/**
 * @returns {{multiplier:number, basis:string, scope:string|null,
 *            sampleSize:number, observedIncidents:number, bookSampleSize:number,
 *            bookIncidents:number, credibility:number, laneFrequency:number|null,
 *            bookFrequency:number|null, blendedFrequency:number|null,
 *            factors:Array<{name:string,factor:number,detail:string}>}}
 */
async function computeLaneRisk({
    originPort, destinationPort, originCountry, destinationCountry,
    containerType, transitDays,
} = {}) {
    const factors = [];
    let lane = { scope: null, sampleSize: 0, incidents: 0, frequency: 0 };
    let book = { scope: 'book', sampleSize: 0, incidents: 0, frequency: 0 };

    try {
        book = await measure({}, 'book');
        if (originPort && destinationPort) {
            lane = await measure({ origin_port: originPort, destination_port: destinationPort }, 'port_pair');
        }
        if (lane.sampleSize === 0 && originCountry && destinationCountry) {
            lane = await measure({ origin_country: originCountry, destination_country: destinationCountry }, 'country_pair');
        }
    } catch {
        // A history lookup failure must not block a quote — fall through to base rate.
        lane = { scope: null, sampleSize: 0, incidents: 0, frequency: 0 };
        book = { scope: 'book', sampleSize: 0, incidents: 0, frequency: 0 };
    }

    const credibility = lane.sampleSize > 0
        ? round(lane.sampleSize / (lane.sampleSize + HALF_CREDIBILITY_SAMPLE), 4)
        : 0;

    let basis = 'base_rate';
    let blended = null;
    if (lane.sampleSize > 0) {
        basis = 'credibility_weighted';
        blended = credibility * lane.frequency + (1 - credibility) * book.frequency;
    } else if (book.sampleSize > 0) {
        // Nothing on this lane, but the platform has a book to price against — an
        // honest fallback, and materially better than pretending risk is average.
        basis = 'book_average';
        blended = book.frequency;
    }

    let multiplier = 1;
    if (blended != null) {
        const laneFactor = Math.min(1 + blended * FREQUENCY_WEIGHT, MAX_LANE_MULTIPLIER);
        multiplier *= laneFactor;
        factors.push({
            name: 'loss_experience',
            factor: round(laneFactor),
            detail: basis === 'credibility_weighted'
                ? `${lane.incidents} qualifying loss${lane.incidents === 1 ? '' : 'es'} over ${lane.sampleSize} shipments on this ${lane.scope === 'port_pair' ? 'port pair' : 'country pair'}, given ${Math.round(credibility * 100)}% weight and blended with ${book.incidents} over ${book.sampleSize} across the book`
                : `no shipments on this lane yet — priced on the book's own record of ${book.incidents} qualifying loss${book.incidents === 1 ? '' : 'es'} over ${book.sampleSize} shipments`,
        });
    }

    const ct = String(containerType || '').toLowerCase();
    const containerFactor = CONTAINER_FACTORS[ct];
    if (containerFactor) {
        multiplier *= containerFactor;
        factors.push({ name: 'container_type', factor: containerFactor, detail: `${ct} cargo carries a distinct loss profile` });
    }

    const days = Number(transitDays) || 0;
    if (days > 30) {
        const transitFactor = Math.min(1 + ((days - 30) / 30) * TRANSIT_FACTOR_PER_MONTH, MAX_TRANSIT_FACTOR);
        multiplier *= transitFactor;
        factors.push({ name: 'transit_duration', factor: round(transitFactor), detail: `${days}-day transit extends exposure beyond a 30-day voyage` });
    }

    return {
        multiplier: round(multiplier),
        basis,
        scope: lane.scope,
        sampleSize: lane.sampleSize,
        observedIncidents: lane.incidents,
        bookSampleSize: book.sampleSize,
        bookIncidents: book.incidents,
        credibility,
        laneFrequency: lane.sampleSize > 0 ? round(lane.frequency, 6) : null,
        bookFrequency: book.sampleSize > 0 ? round(book.frequency, 6) : null,
        blendedFrequency: blended != null ? round(blended, 6) : null,
        factors,
        lookbackMonths: LOOKBACK_MONTHS,
        halfCredibilitySample: HALF_CREDIBILITY_SAMPLE,
    };
}

module.exports = { computeLaneRisk, LOOKBACK_MONTHS, HALF_CREDIBILITY_SAMPLE };
