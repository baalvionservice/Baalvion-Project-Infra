'use strict';
/**
 * Putaway Engine — DB-backed ORCHESTRATOR (mirrors service/logistics/logisticsEngine.js).
 *
 * Wraps the PURE optimizer with the persistence + lifecycle it deliberately
 * avoids:
 *
 *   • suggest()   — loads the warehouse's active leaf bins, runs the optimizer,
 *                   and PERSISTS a tradeops.putaway_tasks row (status
 *                   `suggested`, or `pending` with warnings if no bin qualified
 *                   even after fallback relaxation). Links the task back onto
 *                   its goods_receipt_line when one is supplied.
 *
 *   • assignBin() — records a human accepting the suggestion or overriding it
 *                   with a different bin (status -> `assigned`).
 *
 *   • completeTask() — writes the resulting tradeops.inventory_movements row
 *                   (inbound, to_bin_id = the assigned bin), updates the bin's
 *                   used capacity + FIFO/FEFO consolidation metadata, and
 *                   flips the task to `completed`.
 *
 * The optimizer is fully deterministic and offline; the persistence here is
 * the only stateful part.
 */
const db = require('../../../models');
const { AppError } = require('../../../utils/errors');
const optimizer = require('./putawayOptimizer');
const { FAILURE_KIND, PutawayError } = require('./schema');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

function toView(row) {
    const r = plain(row);
    return {
        id: r.id,
        warehouseId: r.warehouse_id,
        grnLineId: r.grn_line_id,
        packageId: r.package_id,
        suggestedBinId: r.suggested_bin_id,
        assignedBinId: r.assigned_bin_id,
        status: r.status,
        strategy: r.strategy,
        quantity: r.quantity != null ? Number(r.quantity) : null,
        unit: r.unit,
        reasonCodes: r.reason_codes || [],
        overrideReason: r.override_reason,
        assignedBy: r.assigned_by,
        assignedAt: r.assigned_at,
        completedAt: r.completed_at,
        metadata: r.metadata || {},
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

/**
 * Run the putaway optimizer against a warehouse's live bins and persist a task.
 * @param {object} input  see normalize.js for the request shape, plus:
 * @param {string} [input.tenantId] [input.actor]
 * @returns {Promise<{ result: object, task: object }>}
 */
async function suggestPutaway(input = {}) {
    const candidates = await db.WarehouseBin.findAll({
        where: { warehouse_id: input.warehouseId, status: 'active', bin_type: 'bin' },
    });

    let result;
    let failure = null;
    try {
        result = optimizer.suggest(input, candidates.map((c) => plain(c)));
    } catch (err) {
        if (err instanceof PutawayError && err.kind === FAILURE_KIND.NO_CANDIDATE) {
            failure = err;
            result = { request: null, strategy: input.strategy || null, suggestions: [], top: null, warnings: err.detail.warnings || [err.message] };
        } else if (err instanceof PutawayError) {
            throw new AppError('VALIDATION_ERROR', err.message, 400, err.detail);
        } else {
            throw err;
        }
    }

    const top = result.top;
    const task = await db.PutawayTask.create({
        ...(input.tenantId ? { tenant_id: input.tenantId } : {}),
        warehouse_id: input.warehouseId,
        grn_line_id: input.grnLineId || null,
        package_id: input.packageId || null,
        suggested_bin_id: top ? top.binId : null,
        status: top ? 'suggested' : 'pending',
        strategy: 'rule_based',
        quantity: input.quantity,
        unit: input.unit || 'unit',
        reason_codes: top ? top.reasonCodes : [],
        metadata: { warnings: result.warnings || [], scoreBreakdown: top ? top.scoreBreakdown : null },
        created_by: input.actor || null,
    });

    if (input.grnLineId) {
        await db.GoodsReceiptLine.update({ putaway_task_id: task.id }, { where: { id: input.grnLineId } });
    }

    return { result: { ...result, failed: !!failure }, task: toView(task) };
}

/** Tenant-scoped fetch, 404 (never 403) cross-tenant. */
async function fetchTaskOwned(id, { tenantId = null } = {}) {
    const where = { id };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.PutawayTask.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Putaway task not found', 404);
    return row;
}

/**
 * Accept the suggestion or override it with a different bin.
 * @param {string} id  putaway_tasks.id
 * @param {object} opts
 * @param {string} opts.binId              the bin to assign (may equal suggested_bin_id)
 * @param {string} [opts.overrideReason]    required when binId differs from the suggestion
 * @param {string} [opts.tenantId] [opts.actor]
 */
async function assignBin(id, { binId, overrideReason = null, tenantId = null, actor = 'system' } = {}) {
    const row = await fetchTaskOwned(id, { tenantId });
    if (['completed', 'cancelled'].includes(row.status)) {
        throw new AppError('INVALID_TRANSITION', `cannot assign a putaway task in '${row.status}' state`, 409);
    }
    if (!binId) throw new AppError('VALIDATION_ERROR', 'binId is required', 400);

    const isOverride = row.suggested_bin_id && binId !== row.suggested_bin_id;
    if (isOverride && !overrideReason) {
        throw new AppError('VALIDATION_ERROR', 'overrideReason is required when assigning a bin other than the suggested one', 400);
    }

    await row.update({
        assigned_bin_id: binId,
        status: 'assigned',
        strategy: isOverride ? 'manual_override' : 'rule_based',
        override_reason: isOverride ? overrideReason : null,
        assigned_by: actor,
        assigned_at: new Date(),
    });
    return toView(row);
}

/**
 * Complete an assigned putaway: writes the inventory movement, updates bin
 * capacity + FIFO/FEFO consolidation metadata, flips the task to `completed`.
 */
async function completeTask(id, { tenantId = null, actor = 'system' } = {}) {
    const row = await fetchTaskOwned(id, { tenantId });
    if (row.status !== 'assigned') {
        throw new AppError('INVALID_TRANSITION', `cannot complete a putaway task in '${row.status}' state (must be 'assigned')`, 409);
    }

    const bin = await db.WarehouseBin.findByPk(row.assigned_bin_id);
    if (!bin) throw new AppError('NOT_FOUND', 'Assigned bin not found', 404);

    let grnLine = null;
    if (row.grn_line_id) grnLine = await db.GoodsReceiptLine.findByPk(row.grn_line_id);

    const quantity = Number(row.quantity);
    const movement = await db.InventoryMovement.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        warehouse_id: row.warehouse_id,
        package_id: row.package_id,
        to_bin_id: bin.id,
        movement_type: 'inbound',
        quantity,
        unit: row.unit,
        reference_type: 'putaway_task',
        reference_id: row.id,
        occurred_at: new Date(),
        created_by: actor,
    });

    const binUpdates = {
        used_units: (bin.used_units || 0) + quantity,
    };
    if (grnLine && grnLine.weight_kg != null && bin.capacity_weight_kg != null) {
        binUpdates.used_weight_kg = Number(bin.used_weight_kg || 0) + Number(grnLine.weight_kg);
    }
    if (grnLine && grnLine.volume_cbm != null && bin.capacity_volume_cbm != null) {
        binUpdates.used_volume_cbm = Number(bin.used_volume_cbm || 0) + Number(grnLine.volume_cbm);
    }

    const metadata = { ...(bin.metadata || {}) };
    if (grnLine && grnLine.lot_number) metadata.lastLotNumber = grnLine.lot_number;
    if (grnLine && grnLine.manufacture_date && !metadata.oldestReceiptAt) metadata.oldestReceiptAt = grnLine.manufacture_date;
    if (grnLine && grnLine.expiry_date) {
        const current = metadata.nearestExpiryAt ? new Date(metadata.nearestExpiryAt) : null;
        const next = new Date(grnLine.expiry_date);
        if (!current || next < current) metadata.nearestExpiryAt = grnLine.expiry_date;
    }
    binUpdates.metadata = metadata;

    await bin.update(binUpdates);
    await row.update({ status: 'completed', completed_at: new Date() });

    return { task: toView(row), movementId: movement.id };
}

async function listTasks({ tenantId = null, warehouseId, status, page = 1, limit = 20 } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (warehouseId) where.warehouse_id = warehouseId;
    if (status) where.status = status;
    const lim = Math.min(100, Math.max(1, Number(limit) || 20));
    const pg = Math.max(1, Number(page) || 1);
    const { rows, count } = await db.PutawayTask.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: lim, offset: (pg - 1) * lim,
    });
    return { items: rows.map(toView), total: count, page: pg, limit: lim };
}

module.exports = { suggestPutaway, assignBin, completeTask, listTasks, fetchTaskOwned, toView };
