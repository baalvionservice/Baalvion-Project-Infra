'use strict';
// Order journey — mounted at /v1/order_journeys. Static paths come before '/:id' so they are never
// read as an id. Everything requires a signed-in organisation; the rules are in service/journey.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/orderJourneyController');

router.get('/',                                       authMiddleware, ctrl.mine);
router.get('/_status',                                authMiddleware, ctrl.status);
router.get('/_rules',                                 authMiddleware, ctrl.rules);
router.get('/by_order/:orderId',                      authMiddleware, ctrl.byOrder);
router.get('/:id',                                    authMiddleware, ctrl.one);
router.get('/:id/parties',                            authMiddleware, ctrl.listParties);
router.post('/:id/parties',                           authMiddleware, ctrl.invite);
router.post('/:id/parties/:partyId/respond',          authMiddleware, ctrl.respond);
router.patch('/:id/parties/:partyId',                 authMiddleware, ctrl.grants);
router.delete('/:id/parties/:partyId',                authMiddleware, ctrl.remove);
router.get('/:id/events',                             authMiddleware, ctrl.events);

module.exports = router;
