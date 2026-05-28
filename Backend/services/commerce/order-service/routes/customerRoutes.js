'use strict';
const { Router } = require('express');
const ctrl = require('../controller/customerController');
const { validate } = require('../middleware/validate');
const { upsertCustomerSchema, updateCustomerSchema, createAddressSchema, updateAddressSchema } = require('../validators/customerSchemas');

const router = Router({ mergeParams: true });

router.get('/', ctrl.listCustomers);
router.post('/', validate(upsertCustomerSchema), ctrl.upsertCustomer);

router.get('/:customerId', ctrl.getCustomer);
router.patch('/:customerId', validate(updateCustomerSchema), ctrl.updateCustomer);

router.get('/:customerId/addresses', ctrl.listAddresses);
router.post('/:customerId/addresses', validate(createAddressSchema), ctrl.addAddress);
router.patch('/:customerId/addresses/:addressId', validate(updateAddressSchema), ctrl.updateAddress);
router.delete('/:customerId/addresses/:addressId', ctrl.deleteAddress);

module.exports = router;
