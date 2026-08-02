const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const sendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    verificationToken: z.string().min(1, 'Verification token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyEmailSchema,
  resendOTPSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

