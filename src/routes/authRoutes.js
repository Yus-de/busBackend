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
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/app/login', authLimiter, validate(loginSchema), authController.appLogin);
router.post('/dashboard/login', authLimiter, validate(loginSchema), authController.dashboardLogin);

router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', validate(refreshTokenSchema), authController.logout);
router.post('/send-otp', authLimiter, validate(sendOTPSchema), authController.sendOTP);
router.post('/verify-otp', authController.verifyEmail);
router.post('/resend-otp', authLimiter, validate(resendOTPSchema), authController.resendOTP);
router.post('/google', authLimiter, validate(googleLoginSchema), authController.googleLogin);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;

