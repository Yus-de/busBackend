const prisma = require('../config/database');
const { NotFoundError, AppError } = require('../utils/errors');
const generateTicketNumber = require('../utils/generateTicketNumber');
const { lockSeats, releaseSeats, markSeatsAsBooked } = require('./seatService');

const createBooking = async (userId, scheduleId, seatIds) => {
  return await prisma.$transaction(async (tx) => {
    // Verify schedule exists
    const schedule = await tx.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        bus: true,
        route: true,
      },
    });

    if (!schedule) {
      throw new NotFoundError('Schedule');
    }

    if (!schedule.isActive) {
      throw new AppError('Schedule is not active', 400);
    }

    // Lock seats (using transaction client)
    const lockUntil = await lockSeats(scheduleId, seatIds, tx);

    // Calculate total amount (price comes from route now)
    const totalAmount = (schedule.route?.price ?? 0) * seatIds.length;

    // Set booking expiration (same as seat lock)
    const expiresAt = lockUntil;

    // Create booking
    const booking = await tx.booking.create({
      data: {
        userId,
        scheduleId,
        totalAmount,
        ticketNumber: generateTicketNumber(),
        expiresAt,
        status: 'PENDING',
        seats: {
          create: seatIds.map((seatId) => ({
            seatId,
          })),
        },
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
      },
    });

    return booking;
  });
};

const confirmBooking = async (bookingId) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: {
          include: {
            seat: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    if (booking.status !== 'PENDING') {
      throw new AppError('Booking is not in PENDING status', 400);
    }

    // Mark seats as booked
    const seatIds = booking.seats.map((bs) => bs.seatId);
    await markSeatsAsBooked(seatIds, tx);

    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        expiresAt: null,
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        payment: true,
      },
    });

    return updatedBooking;
  });
};

const cancelBooking = async (bookingId, userId, isAdmin = false) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: {
          include: {
            seat: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Check authorization
    if (!isAdmin && booking.userId !== userId) {
      throw new AppError('Unauthorized to cancel this booking', 403);
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    if (booking.status === 'EXPIRED') {
      throw new AppError('Booking has already expired', 400);
    }

    // Release seats if booking is PENDING
    if (booking.status === 'PENDING') {
      const seatIds = booking.seats.map((bs) => bs.seatId);
      await releaseSeats(seatIds, tx);
    }

    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
      },
    });

    return updatedBooking;
  });
};

const expireBookings = async () => {
  const now = new Date();
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: now,
      },
    },
    include: {
      seats: {
        include: {
          seat: true,
        },
      },
    },
  });

  for (const booking of expiredBookings) {
    await prisma.$transaction(async (tx) => {
      // Release seats (using transaction client)
      const seatIds = booking.seats.map((bs) => bs.seatId);
      await releaseSeats(seatIds, tx);

      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'EXPIRED',
        },
      });
    });
  }

  return expiredBookings.length;
};

const getUserBookings = async (userId) => {
  return await prisma.booking.findMany({
    where: { userId },
    include: {
      schedule: {
        include: {
          bus: true,
          route: true,
        },
      },
      seats: {
        include: {
          seat: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const getAllBookings = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  return await prisma.booking.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      schedule: {
        include: {
          bus: true,
          route: true,
        },
      },
      seats: {
        include: {
          seat: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  expireBookings,
  getUserBookings,
  getAllBookings,
};

