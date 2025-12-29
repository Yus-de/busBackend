const prisma = require('../config/database');
const { successResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const createRoute = async (req, res, next) => {
  try {
    const { source, destination, distance, duration } = req.body;
    const route = await prisma.route.create({
      data: {
        source,
        destination,
        distance,
        duration,
      },
    });
    successResponse(res, route, 'Route created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const searchRoutes = async (req, res, next) => {
  try {
    const { source, destination, date } = req.query;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const routes = await prisma.route.findMany({
      where: {
        source: {
          contains: source,
          mode: 'insensitive',
        },
        destination: {
          contains: destination,
          mode: 'insensitive',
        },
      },
      include: {
        schedules: {
          where: {
            departureTime: {
              gte: targetDate,
              lt: nextDay,
            },
            isActive: true,
          },
          include: {
            bus: true,
          },
          orderBy: {
            departureTime: 'asc',
          },
        },
      },
    });

    // Filter routes that have active schedules
    const routesWithSchedules = routes.filter((route) => route.schedules.length > 0);

    successResponse(res, routesWithSchedules, 'Routes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        schedules: {
          include: {
            bus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    successResponse(res, routes, 'Routes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            bus: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundError('Route');
    }

    successResponse(res, route, 'Route retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoute,
  searchRoutes,
  getRoutes,
  getRouteById,
};

