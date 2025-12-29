const prisma = require('../config/database');
const { successResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const createBus = async (req, res, next) => {
  try {
    const { busNumber, busName, totalSeats, seatLayout, amenities } = req.body;
    const bus = await prisma.bus.create({
      data: {
        busNumber,
        busName,
        totalSeats,
        seatLayout,
        amenities: amenities || [],
      },
    });
    successResponse(res, bus, 'Bus created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getBuses = async (req, res, next) => {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: { createdAt: 'desc' },
    });
    successResponse(res, buses, 'Buses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!bus) {
      throw new NotFoundError('Bus');
    }

    successResponse(res, bus, 'Bus retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bus = await prisma.bus.update({
      where: { id },
      data: updateData,
    });

    successResponse(res, bus, 'Bus updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.bus.delete({
      where: { id },
    });
    successResponse(res, null, 'Bus deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
};

