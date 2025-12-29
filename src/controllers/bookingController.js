const bookingService = require('../services/bookingService');
const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

const createBooking = async (req, res, next) => {
  try {
    const { scheduleId, seatIds } = req.body;
    const booking = await bookingService.createBooking(
      req.user.id,
      scheduleId,
      seatIds
    );

    // Create payment intent
    const payment = await paymentService.createPayment(booking.id);

    successResponse(
      res,
      { booking, payment },
      'Booking created successfully. Please complete payment.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    successResponse(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookings = await bookingService.getUserBookings(req.user.id);
    const booking = bookings.find((b) => b.id === id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    successResponse(res, booking, 'Booking retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.cancelBooking(id, req.user.id);
    successResponse(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

