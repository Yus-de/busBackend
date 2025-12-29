const morgan = require('morgan');

// Custom log format
const logFormat = (tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');
};

// Development logger
const devLogger = morgan('dev');

// Production logger
const prodLogger = morgan(logFormat, {
  skip: (req, res) => res.statusCode < 400, // Only log errors in production
});

// Error logger
const errorLogger = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  next(err);
};

module.exports = {
  devLogger,
  prodLogger,
  errorLogger,
};

