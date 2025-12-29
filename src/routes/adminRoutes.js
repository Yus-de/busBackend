const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { getAllBookingsSchema, getRevenueReportSchema } = require('../validations/admin');

router.get('/bookings', authenticate, authorize('ADMIN'), validate(getAllBookingsSchema), adminController.getAllBookings);
router.get('/revenue', authenticate, authorize('ADMIN'), validate(getRevenueReportSchema), adminController.getRevenueReport);
router.get('/users', authenticate, authorize('ADMIN'), adminController.getAllUsers);
router.delete('/bookings/:id', authenticate, authorize('ADMIN'), adminController.cancelBookingAdmin);

module.exports = router;

