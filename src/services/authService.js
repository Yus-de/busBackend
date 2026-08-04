const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');
const { UnauthorizedError, AppError } = require('../utils/errors');
const { USER_ROLES } = require('../utils/constants');


const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpires }
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpires }
  );

  return { accessToken, refreshToken };
};

const saveRefreshToken = async (userId, token, userType = 'app') => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      userType,
      expiresAt,
    },
  });
};

const register = async (userData) => {
  const { email, password, name, phone } = userData;

  // 1. Check if user exists in AppUser
  const existingAppUser = await prisma.appUser.findUnique({ where: { email } });

  if (existingAppUser) {
    // If user is already verified, they must login
    if (existingAppUser.emailVerified) {
      throw new AppError('An account with this email already exists. Please login.', 400);
    }

    // IF USER EXISTS BUT IS NOT VERIFIED: 
    // We update their info (password/name) so they can "restart" registration if they made a mistake
    const hashedPassword = await hashPassword(password);
    const updatedUser = await prisma.appUser.update({
      where: { email },
      data: { name, phone, password: hashedPassword },
    });
    return { user: updatedUser, message: 'Existing unverified account updated. Please verify your email.' };
  }

  // 2. Create new app user (emailVerified defaults to false - requires OTP verification)
  const hashedPassword = await hashPassword(password);
  const user = await prisma.appUser.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      emailVerified: true,
    },
  });

  return { user, message: 'Registration successful. Please verify your email.' };
};

const verifyEmailAndCompleteRegistration = async (email, otp) => {
  const otpService = require('./otpService');

  // 1. Verify OTP (this consumes it and returns verification token)
  const otpResult = await otpService.verifyOTP(email, otp);

  // 2. Check if user exists in AppUser only (dashboard users don't need email verification)
  const user = await prisma.appUser.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('User not found or already verified. Dashboard users do not require email verification.', 404);
  }

  // 3. Update app user to verified
  const updatedUser = await prisma.appUser.update({
    where: { email },
    data: { emailVerified: true },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      emailVerified: true,
    },
  });

  // 4. Generate tokens only AFTER verification
  const { accessToken, refreshToken } = generateTokens(updatedUser.id);
  await saveRefreshToken(updatedUser.id, refreshToken, 'app');

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
};

const login = async (email, password, userType = 'app') => {
  let user;

  // Try to find user in AppUser or DashboardUser based on userType
  if (userType === 'app') {
    user = await prisma.appUser.findUnique({ where: { email } });
  } else {
    user = await prisma.dashboardUser.findUnique({ where: { email } });
  }

  if (!user) {
    const userTypeName = userType === 'app' ? 'App' : 'Dashboard';
    throw new UnauthorizedError(`Invalid credentials - ${userTypeName} user not found`);
  }

  if (!user.password) {
    throw new UnauthorizedError('Invalid credentials - no password set');
  }

  // 1. Check if verified (only for app users)
  if (userType === 'app' && !user.emailVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  // 2. Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials - wrong password');
  }

  // 3. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken, userType);

  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    emailVerified: user.emailVerified,
  };

  // Add role for dashboard users
  if (userType === 'dashboard') {
    userResponse.role = user.role;
  }

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

const appLogin = async (email, password) => {
  const result = await login(email, password, 'app');
  return result;
};

const dashboardLogin = async (email, password) => {
  const result = await login(email, password, 'dashboard');
  const staffRoles = [USER_ROLES.ADMIN, USER_ROLES.CASHIER, USER_ROLES.OPERATION];
  if (!staffRoles.includes(result.user.role)) {
    throw new UnauthorizedError('Access denied. This login is for dashboard users only.');
  }
  return result;
};


const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify user still exists based on userType
    let userExists = false;
    if (tokenRecord.userType === 'app') {
      const user = await prisma.appUser.findUnique({
        where: { id: decoded.userId },
      });
      userExists = !!user;
    } else {
      const user = await prisma.dashboardUser.findUnique({
        where: { id: decoded.userId },
      });
      userExists = !!user;
    }

    if (!userExists) {
      throw new UnauthorizedError('Invalid refresh token - user not found');
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpires }
    );

    return { accessToken };
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

const logout = async (refreshToken) => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

const forgotPassword = async (email) => {
  // OTP and password reset only for app users
  const appUser = await prisma.appUser.findUnique({ where: { email } });

  if (!appUser) {
    throw new AppError('User with this email does not exist or is a dashboard user. Dashboard users cannot reset password via OTP.', 404);
  }

  const otpService = require('./otpService');
  return await otpService.createAndSendOTP(email);
};

const resetPassword = async (email, verificationToken, newPassword) => {
  const otpService = require('./otpService');

  // 1. Verify the verification token (this validates the OTP was already verified)
  const tokenData = await otpService.verifyToken(verificationToken);

  // SECURITY: Use the email from the verified token, not from request body
  const verifiedEmail = tokenData.email;

  // Verify the email in the request matches the email in the token
  if (verifiedEmail !== email) {
    throw new AppError('Email mismatch. Token is not valid for this email.', 400);
  }

  // 2. Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // 3. Update app user password only (dashboard users don't use OTP reset)
  const appUser = await prisma.appUser.findUnique({ where: { email: verifiedEmail } });

  if (!appUser) {
    throw new AppError('User not found or is a dashboard user. Only app users can reset password via OTP.', 404);
  }

  await prisma.appUser.update({
    where: { email: verifiedEmail },
    data: { password: hashedPassword },
  });

  return { message: 'Password reset successfully' };
};

module.exports = {
  register,
  verifyEmailAndCompleteRegistration,
  login,
  appLogin,
  dashboardLogin,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};