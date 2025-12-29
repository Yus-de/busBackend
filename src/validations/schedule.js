const { z } = require('zod');

const createScheduleSchema = z.object({
  body: z.object({
    busId: z.string().uuid('Invalid bus ID'),
    routeId: z.string().uuid('Invalid route ID'),
    departureTime: z.string().datetime('Invalid departure time'),
    arrivalTime: z.string().datetime('Invalid arrival time'),
    price: z.number().positive('Price must be positive'),
  }).refine((data) => {
    const departure = new Date(data.departureTime);
    const arrival = new Date(data.arrivalTime);
    return arrival > departure;
  }, {
    message: 'Arrival time must be after departure time',
    path: ['arrivalTime'],
  }),
});

const getSchedulesSchema = z.object({
  query: z.object({
    routeId: z.string().uuid('Invalid route ID').optional(),
    busId: z.string().uuid('Invalid bus ID').optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
  }),
});

module.exports = {
  createScheduleSchema,
  getSchedulesSchema,
};

