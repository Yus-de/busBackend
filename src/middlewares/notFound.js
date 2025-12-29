const { errorResponse } = require('../utils/response');

const notFound = (req, res) => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = notFound;

