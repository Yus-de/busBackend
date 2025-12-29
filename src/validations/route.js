const { z } = require('zod');

const createRouteSchema = z.object({
  body: z.object({
    source: z.string().min(1, 'Source is required'),
    destination: z.string().min(1, 'Destination is required'),
    distance: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
  }),
});

const searchRoutesSchema = z.object({
  query: z.object({
    source: z.string().min(1, 'Source is required'),
    destination: z.string().min(1, 'Destination is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  }),
});

module.exports = {
  createRouteSchema,
  searchRoutesSchema,
};

