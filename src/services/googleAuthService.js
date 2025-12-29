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

// Save refresh token
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

// Login or register with Google
const loginWithGoogle = async (idToken) => {
  // Verify Google token
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.emailVerified) {
    throw new AppError('Google email is not verified', 400);
  }

  // Check if user exists by Google ID
  let user = await prisma.user.findUnique({
    where: { googleId: googleUser.googleId },
  });

  // If not found by Google ID, check by email
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    // If user exists but doesn't have Google ID, link it
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
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
    user = await prisma.user.create({
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
        role: true,
        emailVerified: true,
      },
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

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

