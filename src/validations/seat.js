const { z } = require('zod');

const getSeatAvailabilitySchema = z.object({
  query: z.object({
    scheduleId: z.string().uuid('Invalid schedule ID'),
  }),
});

module.exports = {
  getSeatAvailabilitySchema,
};

