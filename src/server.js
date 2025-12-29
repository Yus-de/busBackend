require('dotenv').config();
const app = require('./app');
const prisma = require('./config/database');
const bookingService = require('./services/bookingService');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

// Cleanup expired bookings every 5 minutes
setInterval(async () => {
  try {
    const expiredCount = await bookingService.expireBookings();
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired booking(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up expired bookings:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

// Cleanup expired OTPs every hour
setInterval(async () => {
  try {
    const otpService = require('./services/otpService');
    const cleanedCount = await otpService.cleanupExpiredOTPs();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired OTP(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

