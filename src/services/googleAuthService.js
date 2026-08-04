const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { AppError } = require('../utils/errors');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    throw new AppError('Invalid Google token', 401);
  }
};

// Generate JWT tokens
const generateTokens = (userId, userType = 'app') => {
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpires }
  );

  // App users get non-expiring refresh tokens, dashboard users get expiring ones
  const refreshExpires = userType === 'app'
    ? jwtConfig.appRefreshExpires
    : jwtConfig.dashboardRefreshExpires;

  const refreshToken = jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: refreshExpires }
  );

  return { accessToken, refreshToken };
};

// Save refresh token
const saveRefreshToken = async (userId, token, userType = 'app') => {
  const expiresAt = new Date();

  // App users get non-expiring refresh tokens (100 years), dashboard users get 7 days
  if (userType === 'app') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 100); // 100 years = effectively non-expiring
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for dashboard users
  }

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      userType,
      expiresAt,
    },
  });
};

// Login or register with Google
const loginWithGoogle = async (idToken) => {
  // Verify Google token
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.emailVerified) {
    throw new AppError('Google email is not verified', 400);
  }

  // Check if user exists by Google ID
  let user = await prisma.appUser.findUnique({
    where: { googleId: googleUser.googleId },
  });
  if (!user) {
    user = await prisma.appUser.findUnique({
      where: { email: googleUser.email },
    });
    if (user) {
      user = await prisma.appUser.update({
        where: { id: user.id },
      });
    }
    if (!user) {
      user = await prisma.appUser.create({
        data: {
          googleId: googleUser.googleId,
          emailVerified: true, // Google emails are already verified
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
    }
  }

  // Create new user if doesn't exist
  if (!user) {
    user = await prisma.appUser.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        emailVerified: true, // Google emails are already verified
        password: null, // No password for Google OAuth users
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
      },
    });
  }

  // Generate tokens (Google OAuth users are app users)
  const { accessToken, refreshToken } = generateTokens(user.id, 'app');
  await saveRefreshToken(user.id, refreshToken, 'app');

  return {
    user,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  loginWithGoogle,
  verifyGoogleToken,
};

