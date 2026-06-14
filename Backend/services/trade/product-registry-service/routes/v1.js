'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/productController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

router.get('/products', requireTenant, c.listProducts);
router.post('/products', requireTenant, c.createProduct);
router.get('/products/:id', requireTenant, c.getProduct);
router.patch('/products/:id', requireTenant, c.updateProduct);
router.post('/products/:id/retire', requireTenant, c.retireProduct);
router.get('/hs/:hsCode/requirements', requireTenant, c.hsRequirements);

module.exports = router;
