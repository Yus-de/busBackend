const seatService = require('../services/seatService');
const { successResponse } = require('../utils/response');

const getSeatAvailability = async (req, res, next) => {
  try {
    const { scheduleId } = req.query;
    const result = await seatService.getSeatAvailability(scheduleId);
    successResponse(res, result, 'Seat availability retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSeatAvailability,
};

