/**
 * Get pagination parameters from query
 */
const getPaginationParams = (req, defaultLimit = 10, maxLimit = 100) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Create pagination metadata
 */
const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * Create paginated response
 */
const createPaginatedResponse = (data, meta) => {
  return {
    data,
    pagination: meta,
  };
};

module.exports = {
  getPaginationParams,
  createPaginationMeta,
  createPaginatedResponse,
};

