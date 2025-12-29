const { z } = require('zod');

const createCashierSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
  }),
});

const updateCashierSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cashier ID'),
  }),
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
  }),
});

const getCashierSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cashier ID'),
  }),
});

module.exports = {
  createCashierSchema,
  updateCashierSchema,
  getCashierSchema,
};

