const prisma = require('../config/database');
const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/response');

const getAllBookings = async (req, res, next) => {
  try {
    const { status, userId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (userId) filters.userId = userId;

    const bookings = await bookingService.getAllBookings(filters);
    successResponse(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            schedule: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const bookingCount = payments.length;

    // Group by route
    const routeRevenue = {};
    payments.forEach((payment) => {
      const routeKey = `${payment.booking.schedule.route.source}-${payment.booking.schedule.route.destination}`;
      if (!routeRevenue[routeKey]) {
        routeRevenue[routeKey] = {
          route: payment.booking.schedule.route,
          revenue: 0,
          bookings: 0,
        };
      }
      routeRevenue[routeKey].revenue += payment.amount;
      routeRevenue[routeKey].bookings += 1;
    });

    successResponse(res, {
      totalRevenue,
      bookingCount,
      routeRevenue: Object.values(routeRevenue),
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
      },
    }, 'Revenue report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    successResponse(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const cancelBookingAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.cancelBooking(id, null, true);
    successResponse(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getRevenueReport,
  getAllUsers,
  cancelBookingAdmin,
};

