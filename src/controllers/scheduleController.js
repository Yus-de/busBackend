const prisma = require('../config/database');
const { successResponse } = require('../utils/response');
const { NotFoundError, AppError } = require('../utils/errors');

const createSchedule = async (req, res, next) => {
  try {
    const { busId, routeId, departureTime, arrivalTime } = req.body;

    // Verify bus and route exist
    const [bus, route] = await Promise.all([
      prisma.bus.findUnique({ where: { id: busId } }),
      prisma.route.findUnique({ where: { id: routeId } }),
    ]);

    if (!bus) {
      throw new NotFoundError('Bus');
    }

    if (!route) {
      throw new NotFoundError('Route');
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        busId,
        routeId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
      },
      include: {
        bus: true,
        route: true,
      },
    });

    // Create seats for this schedule
    const seatLayout = bus.seatLayout;
    const seats = [];
    let seatNumber = 1;

    for (let row = 1; row <= seatLayout.rows; row++) {
      for (let col = 1; col <= seatLayout.seatsPerRow; col++) {
        const seatLabel = `${row}${String.fromCharCode(64 + col)}`; // 1A, 1B, etc.
        seats.push({
          scheduleId: schedule.id,
          seatNumber: seatLabel,
          isAvailable: true,
        });
        seatNumber++;
      }
    }

    await prisma.seat.createMany({
      data: seats,
    });

    successResponse(res, schedule, 'Schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  try {
    const { routeId, busId, date, isActive } = req.query;

    const where = {};

    if (routeId) {
      where.routeId = routeId;
    }

    if (busId) {
      where.busId = busId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.departureTime = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        bus: true,
        route: true,
      },
      orderBy: { departureTime: 'asc' },
    });
    successResponse(res, schedules, 'Schedules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchedule,
  getSchedules,
};

