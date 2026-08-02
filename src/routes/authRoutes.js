const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyEmailSchema,
  resendOTPSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/auth');
const {
  registerLimiter,
  loginLimiter,
  appLoginLimiter,
  dashboardLoginLimiter,
  refreshLimiter,
  logoutLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  resendOtpLimiter,
  googleLoginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require('../middlewares/rateLimiter');

// Each endpoint has its own rate limiter with a separate counter and a
// different limit value.
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/app/login', appLoginLimiter, validate(loginSchema), authController.appLogin);
router.post('/dashboard/login', dashboardLoginLimiter, validate(loginSchema), authController.dashboardLogin);

router.post('/refresh', refreshLimiter, validate(refreshTokenSchema), authController.refresh);
router.post('/logout', logoutLimiter, validate(refreshTokenSchema), authController.logout);
router.post('/send-otp', sendOtpLimiter, validate(sendOTPSchema), authController.sendOTP);
router.post('/verify-otp', verifyOtpLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-otp', resendOtpLimiter, validate(resendOTPSchema), authController.resendOTP);
router.post('/google', googleLoginLimiter, validate(googleLoginSchema), authController.googleLogin);

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
