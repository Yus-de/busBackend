const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const jwtConfig = require('../config/jwt');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, jwtConfig.accessSecret);

    // Try to find user in AppUser or DashboardUser
    let user = await prisma.appUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        // AppUser has no role field
      },
    });

    let userType = 'app';

    // If not found in AppUser, check DashboardUser
    if (!user) {
      user = await prisma.dashboardUser.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      userType = 'dashboard';
    }

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user and userType to request
    req.user = user;
    req.userType = userType;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError('Invalid token'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Access denied'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

