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

const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

const register = async (userData) => {
  const { email, password, name, phone } = userData;

  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // If user is already verified, they must login
    if (existingUser.emailVerified) {
      throw new AppError('An account with this email already exists. Please login.', 400);
    }

    // IF USER EXISTS BUT IS NOT VERIFIED: 
    // We update their info (password/name) so they can "restart" registration if they made a mistake
    const hashedPassword = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name, phone, password: hashedPassword },
    });
    return { user: updatedUser, message: 'Existing unverified account updated. Please verify your email.' };
  }

  // 2. Create new user (emailVerified defaults to false)
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
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
      role: true,
      emailVerified: true,
    },
  });

  return { user, message: 'Registration successful. Please verify your email.' };
};

const verifyEmailAndCompleteRegistration = async (email, otp) => {
  const otpService = require('./otpService');

  // 1. Verify OTP (this consumes it and returns verification token)
  const otpResult = await otpService.verifyOTP(email, otp);

  // 2. Update existing user to verified
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
    },
  });

  // 3. Generate tokens only AFTER verification
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // 1. Check if verified
  if (!user.emailVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  // 2. Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // 3. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
};

const appLogin = async (email, password) => {
  const result = await login(email, password);
  if (result.user.role !== USER_ROLES.USER) {
    throw new UnauthorizedError('Access denied. This login is for app users only.');
  }
  return result;
};

const dashboardLogin = async (email, password) => {
  const result = await login(email, password);
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
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
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
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('User with this email does not exist', 404);
  }

  const otpService = require('./otpService');
  return await otpService.createAndSendOTP(email);
};

const resetPassword = async (email, verificationToken, newPassword) => {
  const otpService = require('./otpService');

  // 1. Verify the verification token (this validates the OTP was already verified)
  const tokenData = await otpService.verifyToken(verificationToken);

  // SECURITY: Use the email from the verified token, not from request body
  // This ensures the token can only be used for the email it was generated for
  const verifiedEmail = tokenData.email;

  // Verify the email in the request matches the email in the token
  if (verifiedEmail !== email) {
    throw new AppError('Email mismatch. Token is not valid for this email.', 400);
  }

  // 2. Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // 3. Update user password using the verified email
  await prisma.user.update({
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