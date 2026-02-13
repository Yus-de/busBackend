const { AppError, ValidationError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Validation errors - check for ValidationError instance first
  if (err instanceof ValidationError) {
    return errorResponse(res, err.message, err.statusCode, err.errors);
  }

  // Zod validation errors (direct from Zod, not wrapped)
  if (err.name === 'ZodError') {
    const message = 'Validation Error';
    const errors = err.errors ? err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })) : [];
    return errorResponse(res, message, 400, errors);
  }

  let error = { ...err };
  error.message = err.message;

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  } else if (err.code === 'P2025') {
    const message = 'Record not found';
    error = new AppError(message, 404);
  } else if (
    (err.code && err.code.startsWith('P')) ||
    (err.name && err.name.startsWith('Prisma')) ||
    (err.message && (err.message.includes('prisma') || err.message.includes('invocation')))
  ) {
    let message = 'Database operation failed. Please try again later.';
    if (err.message && err.message.includes('Server has closed the connection')) {
      message = 'Database connection error. Please try again later.';
    }
    error = new AppError(message, 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  errorResponse(res, message, statusCode);
};

module.exports = errorHandler;

