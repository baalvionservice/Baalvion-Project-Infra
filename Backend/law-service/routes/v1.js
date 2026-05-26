'use strict';
const router = require('express').Router();

router.use('/auth',           require('./authRoutes'));
router.use('/categories',     require('./categoriesRoutes'));
router.use('/subcategories',  require('./subcategoriesRoutes'));
router.use('/articles',       require('./articleRoutes'));
router.use('/lawyers',        require('./lawyerRoutes'));
router.use('/clients',        require('./clientRoutes'));
router.use('/bookings',       require('./bookingRoutes'));
router.use('/cases',          require('./caseRoutes'));
router.use('/messages',       require('./messageRoutes'));
router.use('/documents',      require('./documentRoutes'));
router.use('/payments',       require('./paymentRoutes'));
router.use('/subscriptions',  require('./subscriptionRoutes'));
router.use('/reviews',        require('./reviewRoutes'));
router.use('/notifications',  require('./notificationRoutes'));
router.use('/referrals',      require('./referralRoutes'));
router.use('/admin',          require('./adminRoutes'));

module.exports = router;
