const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createBookingSchema, cancelBookingSchema } = require('../validations/booking');

router.post('/', authenticate, validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.delete('/:id', authenticate, validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;

