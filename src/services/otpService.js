const prisma = require('../config/database');
const nodemailer = require('nodemailer');
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
  // Development mode check
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log(`📧 DEV MODE OTP for ${email}: ${code}`);
    return true;
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ SMTP missing. OTP for ${email}: ${code}`);
        return true;
      }
      throw new AppError('Email service not configured.', 500);
    }

    console.log(`Step A: Creating transporter for ${email}...`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification OTP - Busly',
      html: `<h1>Your code is ${code}</h1>`, // Simplified for testing
    };

    console.log(`Step B: Sending email via ${process.env.SMTP_HOST}...`);
    
    // This is where it usually hangs. The timeout we added above will fix this.
    await transporter.sendMail(mailOptions);
    
    console.log(`Step C: Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP ERROR:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fallback: OTP for ${email} is ${code}`);
      return true;
    }
    
    throw new AppError(`Email failed: ${error.message}`, 500);
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

