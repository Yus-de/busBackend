const prisma = require('../config/database');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { AppError } = require('../utils/errors');

// Email transporter configuration
const createTransporter = () => {
  // For development, you can use Gmail or other SMTP services
  // For production, use services like SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
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
  // Development mode: Log OTP to console instead of sending email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('\n========================================');
    console.log('📧 OTP FOR DEVELOPMENT MODE');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`OTP Code: ${code}`);
    console.log('========================================\n');
    return true;
  }

  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // In development, log OTP instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('\n========================================');
        console.log('⚠️  SMTP not configured - OTP logged instead');
        console.log('========================================');
        console.log(`Email: ${email}`);
        console.log(`OTP Code: ${code}`);
        console.log('========================================\n');
        return true;
      }
      throw new AppError('Email service not configured. Please configure SMTP settings.', 500);
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification OTP - Bus Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with Bus Booking System!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // In development, log OTP instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('⚠️  Email sending failed - OTP logged instead');
      console.log('========================================');
      console.log(`Email: ${email}`);
      console.log(`OTP Code: ${code}`);
      console.log('Error:', error.message);
      console.log('========================================\n');
      return true;
    }
    
    // In production, throw error
    throw new AppError(
      'Failed to send verification email. Please check your email configuration or contact support.',
      500
    );
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

