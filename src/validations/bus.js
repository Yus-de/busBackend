const { z } = require('zod');

const createBusSchema = z.object({
  body: z.object({
    busNumber: z.string().min(1, 'Bus number is required'),
    busName: z.string().min(1, 'Bus name is required'),
    totalSeats: z.number().int().positive('Total seats must be positive'),
    seatLayout: z.object({
      rows: z.number().int().positive(),
      seatsPerRow: z.number().int().positive(),
      layout: z.enum(['2x2', '3x2']),
    }),
    amenities: z.array(z.string()).optional(),
  }),
});

const updateBusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid bus ID'),
  }),
  body: z.object({
    busName: z.string().min(1).optional(),
    totalSeats: z.number().int().positive().optional(),
    seatLayout: z.object({
      rows: z.number().int().positive(),
      seatsPerRow: z.number().int().positive(),
      layout: z.enum(['2x2', '3x2']),
    }).optional(),
    amenities: z.array(z.string()).optional(),
  }),
});

module.exports = {
  createBusSchema,
  updateBusSchema,
};

