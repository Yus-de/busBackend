const authService = require('../services/authService');
const otpService = require('../services/otpService');
const googleAuthService = require('../services/googleAuthService');
const { successResponse } = require('../utils/response');

const register = async ({ email, password, name, phone }) => {
  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. CREATE user with emailVerified as FALSE
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      emailVerified: false, // Important
    },
  });

  // Return user without token (they aren't verified yet)
  return { user };
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    successResponse(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await otpService.createAndSendOTP(email);
    successResponse(res, result, 'OTP sent to your email');
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmailAndCompleteRegistration(email, otp);
    successResponse(res, result, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
// 1. Verify the OTP (This should throw error if invalid/expired)
  await otpService.verifyOTP(email, otp);

  // 2. Find the user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 3. UPDATE the existing user instead of creating a new one
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  // 4. GENERATE TOKENS NOW (Registration is now complete)
  const accessToken = jwt.sign({ id: updatedUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  return {
    user: updatedUser,
    accessToken,
  };
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await otpService.resendOTP(email);
    successResponse(res, result, 'OTP resent to your email');
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await googleAuthService.loginWithGoogle(idToken);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendOTP,
  verifyEmail,
  resendOTP,
  googleLogin,
};

