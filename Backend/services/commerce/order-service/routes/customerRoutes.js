'use strict';
const { Router } = require('express');
const ctrl = require('../controller/customerController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { upsertCustomerSchema, updateCustomerSchema, createAddressSchema, updateAddressSchema } = require('../validators/customerSchemas');

const router = Router({ mergeParams: true });

// Listing a store's customers exposes cross-tenant PII → require a store role.
// The remaining routes are part of the checkout/self-service surface (a customer is upserted
// during checkout); customer-ownership scoping for individual records is a separate follow-up.
router.get('/', loadStoreRole, requireStoreRole('store_viewer'), ctrl.listCustomers);
router.post('/', validate(upsertCustomerSchema), ctrl.upsertCustomer);

// ── /me-scoped saved addresses (customer resolved server-side from req.auth.userId) ───────────
// MUST precede the '/:customerId' routes so 'me' is not parsed as a customerId. The router is
// already under authMiddleware (routes/v1.js); the customer is resolved from the token, so these
// are IDOR-safe by construction and need NO store role.
router.get('/me/addresses', ctrl.listMyAddresses);
router.post('/me/addresses', validate(createAddressSchema), ctrl.addMyAddress);
router.patch('/me/addresses/:addressId', validate(updateAddressSchema), ctrl.updateMyAddress);
router.delete('/me/addresses/:addressId', ctrl.deleteMyAddress);

router.get('/:customerId', ctrl.getCustomer);
router.patch('/:customerId', validate(updateCustomerSchema), ctrl.updateCustomer);

router.get('/:customerId/addresses', ctrl.listAddresses);
router.post('/:customerId/addresses', validate(createAddressSchema), ctrl.addAddress);
router.patch('/:customerId/addresses/:addressId', validate(updateAddressSchema), ctrl.updateAddress);
router.delete('/:customerId/addresses/:addressId', ctrl.deleteAddress);

module.exports = router;
