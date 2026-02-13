const { z } = require('zod');

const getRevenueReportSchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

const getAllBookingsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED']).optional(),
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
});

module.exports = {
  getRevenueReportSchema,
  getAllBookingsSchema,
};

