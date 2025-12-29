const { z } = require('zod');

const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID'),
    paymentMethod: z.enum(['card', 'upi', 'wallet']).optional(),
  }),
});

const confirmPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
    transactionId: z.string().min(1, 'Transaction ID must not be empty if provided').optional(),
    collector: z.enum(['CASHIER', 'BANK', 'ONLINE', 'MOBILE_BANKING', 'CARD']).optional(),
    bankReference: z.string().optional(), // Required if collector is BANK
  }).refine((data) => {
    // If collector is BANK, bankReference is required
    if (data.collector === 'BANK' && !data.bankReference) {
      return false;
    }
    return true;
  }, {
    message: 'Bank reference is required when collector is BANK',
    path: ['bankReference'],
  }),
});

const webhookPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
    status: z.enum(['success', 'completed', 'failed', 'pending']),
    transactionId: z.string().optional(),
  }),
});

module.exports = {
  createPaymentSchema,
  confirmPaymentSchema,
  webhookPaymentSchema,
};

