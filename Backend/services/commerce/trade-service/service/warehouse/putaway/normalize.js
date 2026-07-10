'use strict';
/**
 * Putaway Engine — canonical request normalizer + validation (PURE).
 * Mirrors service/logistics/normalize.js's role: the single place a raw
 * caller payload becomes the canonical shape every downstream module trusts.
 */
const { STRATEGY, VALID_STRATEGIES, DEFAULT_STRATEGY, num, putawayError, FAILURE_KIND } = require('./schema');

/**
 * @param {object} req
 * @param {string} req.warehouseId          required
 * @param {number} req.quantity             required, > 0
 * @param {string} [req.unit]
 * @param {string} [req.zoneId]             optional zone hint (narrows the initial search)
 * @param {number} [req.weightKg]
 * @param {number} [req.volumeCbm]
 * @param {string} [req.hazardClass]        null/undefined = non-hazardous
 * @param {string} [req.temperatureRequirement] null/undefined = ambient-compatible
 * @param {string} [req.abcClass]           'A' | 'B' | 'C'
 * @param {string} [req.lotNumber]
 * @param {string} [req.expiryDate]         ISO date string
 * @param {string} [req.strategy]           STRATEGY.*, default STRATEGY.FIFO
 * @returns {object} a frozen normalized request
 * @throws {PutawayError} kind VALIDATION on a structurally invalid request
 */
function normalizePutawayRequest(req = {}) {
    if (!req.warehouseId) throw putawayError(FAILURE_KIND.VALIDATION, 'warehouseId is required');
    const quantity = num(req.quantity);
    if (quantity <= 0) throw putawayError(FAILURE_KIND.VALIDATION, 'quantity must be a positive number');
    if (req.strategy && !VALID_STRATEGIES.includes(req.strategy)) {
        throw putawayError(FAILURE_KIND.VALIDATION, `strategy must be one of: ${VALID_STRATEGIES.join(', ')}`);
    }
    if (req.abcClass && !['A', 'B', 'C'].includes(req.abcClass)) {
        throw putawayError(FAILURE_KIND.VALIDATION, "abcClass must be one of: A, B, C");
    }

    return Object.freeze({
        warehouseId: String(req.warehouseId),
        zoneId: req.zoneId ? String(req.zoneId) : null,
        quantity,
        unit: req.unit ? String(req.unit) : 'unit',
        weightKg: req.weightKg != null ? num(req.weightKg) : null,
        volumeCbm: req.volumeCbm != null ? num(req.volumeCbm) : null,
        hazardClass: req.hazardClass ? String(req.hazardClass) : null,
        temperatureRequirement: req.temperatureRequirement ? String(req.temperatureRequirement) : null,
        abcClass: req.abcClass || null,
        lotNumber: req.lotNumber ? String(req.lotNumber) : null,
        expiryDate: req.expiryDate ? String(req.expiryDate) : null,
        strategy: VALID_STRATEGIES.includes(req.strategy) ? req.strategy : DEFAULT_STRATEGY,
        grnLineId: req.grnLineId ? String(req.grnLineId) : null,
        packageId: req.packageId ? String(req.packageId) : null,
    });
}

module.exports = { normalizePutawayRequest };
