const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');
const { UnauthorizedError, AppError } = require('../utils/errors');

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
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // Prevent duplicate registrations
  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new AppError('User already exists and email is verified. Please login instead.', 400);
    } else {
      // User exists but email is not verified - tell them to use resend OTP
      throw new AppError(
        'An account with this email already exists but is not verified. Please use the resend OTP endpoint to receive a new verification code.',
        400
      );
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user (email not verified yet)
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
      createdAt: true,
    },
  });

  // OTP will be sent separately via verify-email endpoint
  // Don't generate tokens here - user needs to verify email first

  return {
    user,
    message: 'Registration successful. Please verify your email.',
  };
};

// Verify email and complete registration
const verifyEmailAndCompleteRegistration = async (email, otp) => {
  const otpService = require('./otpService');

  // Verify OTP
  await otpService.verifyOTP(email, otp);

  // Update user email as verified
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
      createdAt: true,
    },
  });

  // Generate tokens after email verification
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  // Check if user has password (not Google OAuth user)
  if (!user.password) {
    throw new AppError('Please use Google login for this account', 400);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
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

const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpires }
    );

    return { accessToken };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
};

const logout = async (refreshToken) => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

module.exports = {
  register,
  verifyEmailAndCompleteRegistration,
  login,
  refreshAccessToken,
  logout,
};

