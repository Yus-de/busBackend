const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logData, null, 2));
    }
  });

  next();
};

module.exports = requestLogger;

