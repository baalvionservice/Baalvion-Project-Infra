'use strict';
// Logistics Core Foundation (Phase 3) — itemized shipment cost ledger.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/shipmentChargeController');

const view = requirePermission(LOGISTICS_PERMISSIONS.COST_VIEW);
const approveManage = requirePermission(LOGISTICS_PERMISSIONS.COST_APPROVE);

/**
 * @openapi
 * /shipment_charges:
 *   get:
 *     tags: [Shipment Charges]
 *     summary: List shipment charges
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: chargeType, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string, enum: [pending, approved, invoiced, paid, disputed] } }
 *     responses:
 *       200: { description: Paginated list of charges }
 *   post:
 *     tags: [Shipment Charges]
 *     summary: Record a shipment charge line item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipmentId, chargeType, amount]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               chargeType: { type: string, enum: [freight, customs_duty, insurance_premium, handling, documentation, demurrage, detention, other] }
 *               amount: { type: number }
 *               currency: { type: string }
 *     responses:
 *       201: { description: Charge created }
 */
router.get('/',    authMiddleware, view, c.list);
router.post('/',   authMiddleware, view, c.create);

/**
 * @openapi
 * /shipment_charges/{id}:
 *   get:
 *     tags: [Shipment Charges]
 *     summary: Get a shipment charge by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Shipment charge }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, view, c.get);

/**
 * @openapi
 * /shipment_charges/{id}/approve:
 *   post:
 *     tags: [Shipment Charges]
 *     summary: Approve a charge (pending -> approved); requires COST_APPROVE
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Charge approved }
 *       409: { description: Invalid transition, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 * /shipment_charges/{id}/mark_invoiced:
 *   post:
 *     tags: [Shipment Charges]
 *     summary: Mark a charge invoiced (approved -> invoiced)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Charge marked invoiced }
 * /shipment_charges/{id}/mark_paid:
 *   post:
 *     tags: [Shipment Charges]
 *     summary: Mark a charge paid (invoiced -> paid)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Charge marked paid }
 * /shipment_charges/{id}/dispute:
 *   post:
 *     tags: [Shipment Charges]
 *     summary: Dispute a charge (any non-terminal state -> disputed)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Charge disputed }
 */
router.post('/:id/approve',      authMiddleware, approveManage, c.approve);
router.post('/:id/mark_invoiced', authMiddleware, approveManage, c.markInvoiced);
router.post('/:id/mark_paid',     authMiddleware, approveManage, c.markPaid);
router.post('/:id/dispute',       authMiddleware, view, c.dispute);

module.exports = router;
