const { z } = require('zod');

const getTransactionsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
    collector: z.enum(['CASHIER', 'BANK', 'ONLINE', 'MOBILE_BANKING', 'CARD']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

module.exports = {
  getTransactionsSchema,
};

