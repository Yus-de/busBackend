const rateLimit = require('express-rate-limit');

// Explicitly rate limit by client IP address.
// Requires `app.set('trust proxy', N)` (already set in app.js) so req.ip
// reflects the real client IP when behind a proxy (Render/Heroku/AWS).
const keyGenerator = (req) => req.ip;

// In development, use generous limits so testing isn't blocked.
// In production, enforce strict limits to prevent brute-force attacks.
const isDev = process.env.NODE_ENV === 'development';

// Helper to create a per-endpoint rate limiter with separate counters.
// Each call to rateLimit() creates an independent store, so limits are
// tracked separately per endpoint (not shared across all auth routes).
const createLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? max * 200 : max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
  });

// --- Auth endpoint rate limiters (each endpoint has its own limit) ---

const registerLimiter = createLimiter(
  5,
  'Too many registration attempts from this IP, please try again later'
);

const loginLimiter = createLimiter(
  5,
  'Too many login attempts from this IP, please try again later'
);

const appLoginLimiter = createLimiter(
  5,
  'Too many app login attempts from this IP, please try again later'
);

const dashboardLoginLimiter = createLimiter(
  5,
  'Too many dashboard login attempts from this IP, please try again later'
);

const refreshLimiter = createLimiter(
  10,
  'Too many token refresh requests from this IP, please try again later'
);

const logoutLimiter = createLimiter(
  20,
  'Too many logout requests from this IP, please try again later'
);

const sendOtpLimiter = createLimiter(
  3,
  'Too many OTP send requests from this IP, please try again later'
);

const verifyOtpLimiter = createLimiter(
  5,
  'Too many OTP verification attempts from this IP, please try again later'
);

const resendOtpLimiter = createLimiter(
  3,
  'Too many OTP resend requests from this IP, please try again later'
);

const googleLoginLimiter = createLimiter(
  5,
  'Too many Google login attempts from this IP, please try again later'
);

const forgotPasswordLimiter = createLimiter(
  3,
  'Too many password reset requests from this IP, please try again later'
);

const resetPasswordLimiter = createLimiter(
  5,
  'Too many password reset attempts from this IP, please try again later'
);

module.exports = {
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
};
