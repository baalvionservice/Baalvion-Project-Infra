const { Router } = require('express');
const catalogRoutes = require('./catalogRoutes');
const ordersRoutes = require('./ordersRoutes');
const billingRoutes = require('./billingRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

router.use('/giftcards', catalogRoutes);
router.use('/giftcards', ordersRoutes);
router.use('/giftcards', billingRoutes);
router.use('/giftcards', adminRoutes);

module.exports = router;
