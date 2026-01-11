const authService = require('../services/authService');
const otpService = require('../services/otpService');
const googleAuthService = require('../services/googleAuthService');
const { successResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    const result = await authService.register({ email, password, name, phone });
    
    try {
      await otpService.createAndSendOTP(email);
    } catch (otpError) {
      if (process.env.NODE_ENV !== 'development') throw otpError;
    }

    successResponse(res, result, 'User registered successfully. Please verify your email.', 201);
  } catch (error) {
    next(error);
  }
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

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmailAndCompleteRegistration(email, otp);
    successResponse(res, result, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// ADDED THIS FUNCTION (Was missing, causing your crash)
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await otpService.createAndSendOTP(email);
    successResponse(res, result, 'OTP sent to your email');
  } catch (error) {
    next(error);
  }
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
  verifyEmail,
  sendOTP,    // <--- Ensure this is exported
  resendOTP,
  refresh,
  logout,
  googleLogin,
};