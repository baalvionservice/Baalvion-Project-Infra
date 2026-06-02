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

router.get('/:customerId', ctrl.getCustomer);
router.patch('/:customerId', validate(updateCustomerSchema), ctrl.updateCustomer);

router.get('/:customerId/addresses', ctrl.listAddresses);
router.post('/:customerId/addresses', validate(createAddressSchema), ctrl.addAddress);
router.patch('/:customerId/addresses/:addressId', validate(updateAddressSchema), ctrl.updateAddress);
router.delete('/:customerId/addresses/:addressId', ctrl.deleteAddress);

module.exports = router;
