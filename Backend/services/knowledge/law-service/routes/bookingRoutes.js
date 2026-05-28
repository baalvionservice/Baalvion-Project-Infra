'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/bookingController');

router.get('/',                        authMiddleware, ctrl.listBookings);
router.post('/',                       authMiddleware, ctrl.createBooking);
router.get('/:id',                     authMiddleware, ctrl.getBooking);
router.patch('/:id/status',            authMiddleware, ctrl.updateBookingStatus);
router.post('/:id/cancel',             authMiddleware, ctrl.cancelBooking);

module.exports = router;
