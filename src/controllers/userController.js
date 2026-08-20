const prisma = require('../config/database');
const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/response');

const getMe = async (req, res, next) => {
  try {
    // req.user is already populated by authenticate middleware
    // Just return it with additional fields based on user type
    const user = {
      ...req.user,
      userType: req.userType || 'app',
    };
    successResponse(res, user, 'User profile retrieved successfully');
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

module.exports = {
  getMe,
  getMyBookings,
};

