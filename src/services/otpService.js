const prisma = require('../config/database');
const nodemailer = require('nodemailer');
const { Resend } = require('resend'); // Change this
const otpGenerator = require('otp-generator');
const { AppError } = require('../utils/errors');

// Email transporter configuration
// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // ADD THESE TIMEOUTS TO STOP THE SPINNING
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

// Lazy-initialize Resend client only when needed
let resend = null;
const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};


// Generate OTP code
const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

// Send OTP via email
const sendOTP = async (email, code) => {
  // Development mode fallback
  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log(`📧 [DEV] OTP for ${email}: ${code}`);
    return true;
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new AppError('Resend API Key is missing.', 500);
    }

    console.log(`Sending Resend email to ${email}...`);

    const resendClient = getResendClient();
    if (!resendClient) {
      throw new AppError('Resend API Key is missing.', 500);
    }

    const { data, error } = await resendClient.emails.send({
      from: 'Busly <onboarding@resend.dev>', // Use this default for testing
      to: email,
      subject: 'Verification Code - Busly',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Confirm your email</h2>
          <p>Your 6-digit verification code is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully via Resend:', data.id);
    return true;
  } catch (error) {
    console.error('Error in sendOTP:', error.message);

    // Fallback for dev if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fallback: OTP for ${email} is ${code}`);
      return true;
    }

    throw new AppError('Failed to send verification email.', 500);
  }
};

// Create and send OTP
const createAndSendOTP = async (email) => {
  // Delete any existing unused OTPs for this email
  await prisma.oTP.deleteMany({
    where: {
      email,
      isUsed: false,
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Generate OTP
  const code = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  // Save OTP to database
  await prisma.oTP.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // Send OTP via email
  await sendOTP(email, code);

  return {
    message: 'OTP sent to your email',
    expiresIn: 600, // 10 minutes in seconds
  };
};

// Verify OTP
const verifyOTP = async (email, code) => {
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otp) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Check if OTP is expired
  if (otp.expiresAt < new Date()) {
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });
    throw new AppError('OTP has expired', 400);
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return true;
};

// Resend OTP
const resendOTP = async (email, requireUser = true) => {
  if (requireUser) {
    // Check if email exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found. Please register first.', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email already verified. Please login instead.', 400);
    }
  }

  return await createAndSendOTP(email);
};

// Clean up expired OTPs (can be called periodically)
const cleanupExpiredOTPs = async () => {
  const result = await prisma.oTP.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isUsed: true },
      ],
    },
  });
  return result.count;
};

module.exports = {
  createAndSendOTP,
  verifyOTP,
  resendOTP,
  cleanupExpiredOTPs,
};

