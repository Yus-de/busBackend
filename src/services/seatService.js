const prisma = require('../config/database');
const { NotFoundError, AppError } = require('../utils/errors');

const SEAT_LOCK_DURATION = parseInt(process.env.SEAT_LOCK_DURATION || '10', 10); // minutes

const getSeatAvailability = async (scheduleId) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      bus: true,
      route: true,
      seats: {
        orderBy: { seatNumber: 'asc' },
      },
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule');
  }

  // Clean up expired locks
  const now = new Date();
  await prisma.seat.updateMany({
    where: {
      scheduleId,
      lockedUntil: {
        lt: now,
      },
    },
    data: {
      lockedUntil: null,
      isAvailable: true,
    },
  });

  // Get updated seats
  const seats = await prisma.seat.findMany({
    where: { scheduleId },
    orderBy: { seatNumber: 'asc' },
    include: {
      bookings: {
        where: {
          booking: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
    },
  });

  const availability = seats.map((seat) => {
    const isLocked = seat.lockedUntil && seat.lockedUntil > now;
    const isBooked = seat.bookings.length > 0;

    return {
      id: seat.id,
      seatNumber: seat.seatNumber,
      isAvailable: !isLocked && !isBooked && seat.isAvailable,
      isLocked,
      lockedUntil: seat.lockedUntil,
    };
  });

  return {
    schedule: {
      id: schedule.id,
      bus: schedule.bus,
      route: schedule.route,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price,
    },
    seats: availability,
  };
};

const lockSeats = async (scheduleId, seatIds, txClient = null) => {
  const client = txClient || prisma;
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + SEAT_LOCK_DURATION);

  // Check if seats are available
  const seats = await client.seat.findMany({
    where: {
      id: { in: seatIds },
      scheduleId,
    },
    include: {
      bookings: {
        where: {
          booking: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
        },
      },
    },
  });

  if (seats.length !== seatIds.length) {
    throw new NotFoundError('One or more seats not found');
  }

  const now = new Date();
  for (const seat of seats) {
    const isLocked = seat.lockedUntil && seat.lockedUntil > now;
    const isBooked = seat.bookings.length > 0;

    if (isLocked || isBooked || !seat.isAvailable) {
      throw new AppError(`Seat ${seat.seatNumber} is not available`, 400);
    }
  }

  // Lock the seats
  await client.seat.updateMany({
    where: {
      id: { in: seatIds },
    },
    data: {
      lockedUntil: lockUntil,
      isAvailable: false,
    },
  });

  return lockUntil;
};

const releaseSeats = async (seatIds, txClient = null) => {
  const client = txClient || prisma;
  await client.seat.updateMany({
    where: {
      id: { in: seatIds },
    },
    data: {
      lockedUntil: null,
      isAvailable: true,
    },
  });
};

const markSeatsAsBooked = async (seatIds, txClient = null) => {
  const client = txClient || prisma;
  await client.seat.updateMany({
    where: {
      id: { in: seatIds },
    },
    data: {
      lockedUntil: null,
      isAvailable: false,
    },
  });
};

module.exports = {
  getSeatAvailability,
  lockSeats,
  releaseSeats,
  markSeatsAsBooked,
};

