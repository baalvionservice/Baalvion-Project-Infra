'use strict';
// Logistics Core Foundation (Phase 3) — RMA returns.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/returnController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.RETURN_MANAGE);

/**
 * @openapi
 * /returns:
 *   get:
 *     tags: [Returns]
 *     summary: List RMA returns
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: reason, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string, enum: [requested, approved, in_transit, received, refunded, rejected] } }
 *     responses:
 *       200: { description: Paginated list of returns }
 *   post:
 *     tags: [Returns]
 *     summary: Request a return (RMA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipmentId, reason]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               reason: { type: string, enum: [damaged, wrong_item, quality_issue, customer_request, other] }
 *               quantity: { type: integer }
 *     responses:
 *       201: { description: Return requested }
 */
router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.create);

/**
 * @openapi
 * /returns/{id}:
 *   get:
 *     tags: [Returns]
 *     summary: Get a return by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

/**
 * @openapi
 * /returns/{id}/approve:
 *   post:
 *     tags: [Returns]
 *     summary: Approve a return (requested -> approved)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return approved }
 * /returns/{id}/ship:
 *   post:
 *     tags: [Returns]
 *     summary: Mark a return in transit (approved -> in_transit)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return in transit }
 * /returns/{id}/receive:
 *   post:
 *     tags: [Returns]
 *     summary: Mark a return received (in_transit -> received)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return received }
 * /returns/{id}/refund:
 *   post:
 *     tags: [Returns]
 *     summary: Refund a return (received -> refunded)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return refunded }
 * /returns/{id}/reject:
 *   post:
 *     tags: [Returns]
 *     summary: Reject a return (requested/approved -> rejected)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Return rejected }
 */
router.post('/:id/approve', authMiddleware, manage, c.approve);
router.post('/:id/ship',    authMiddleware, manage, c.ship);
router.post('/:id/receive', authMiddleware, manage, c.receive);
router.post('/:id/refund',  authMiddleware, manage, c.refund);
router.post('/:id/reject',  authMiddleware, manage, c.reject);

module.exports = router;
