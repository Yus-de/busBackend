const { z } = require('zod');

const createBookingSchema = z.object({
  body: z.object({
    scheduleId: z.string().uuid('Invalid schedule ID'),
    seatIds: z.preprocess((val) => (typeof val === 'string' ? [val] : val), z.array(z.string().uuid('Invalid seat ID')).min(1, 'At least one seat is required')),
  }),
});

const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
};

