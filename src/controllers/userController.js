const prisma = require('../config/database');
const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/response');

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
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

