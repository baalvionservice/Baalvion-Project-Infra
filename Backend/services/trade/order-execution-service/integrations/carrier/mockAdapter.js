'use strict';
/**
 * ⚠️ DEV-ONLY in-memory carrier-tracking mock. NOT PRODUCTION SAFE. Returns
 * canned milestones; reflects NO real shipment. Honors the fail-open posture:
 * tracking numbers containing 'down-test' simulate provider unavailability and
 * return a degraded result instead of throwing.
 */
const { TRACKING_STATUS } = require('./contract');

/** @returns {import('./contract').CarrierProvider} */
function createMockCarrierProvider() {
    return {
        name: 'mock-carrier',
        IS_PRODUCTION_SAFE: false,

        async track({ trackingNumber, carrier } = {}) {
            if (!trackingNumber) throw new Error('trackingNumber required');
            // Fail-open simulation: provider "down" => degraded, never throws.
            if (String(trackingNumber).includes('down-test')) {
                return {
                    trackingNumber,
                    carrier,
                    status: TRACKING_STATUS.UNKNOWN,
                    events: [],
                    degraded: true,
                };
            }
            const now = new Date().toISOString();
            return {
                trackingNumber,
                carrier: carrier || 'MOCK-LINE',
                status: TRACKING_STATUS.IN_TRANSIT,
                events: [
                    { timestamp: now, status: TRACKING_STATUS.BOOKED, location: 'CNSHA', description: 'Booked' },
                    { timestamp: now, status: TRACKING_STATUS.IN_TRANSIT, location: 'SGSIN', description: 'Departed' },
                ],
                eta: now,
                degraded: false,
            };
        },
    };
}

module.exports = { createMockCarrierProvider, IS_PRODUCTION_SAFE: false };
