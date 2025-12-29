const prisma = require('../config/database');
const { NotFoundError, AppError } = require('../utils/errors');
const { confirmBooking, cancelBooking } = require('./bookingService');

const createPayment = async (bookingId, paymentMethod = 'card') => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    if (booking.status !== 'PENDING') {
      throw new AppError('Booking is not in PENDING status', 400);
    }

    if (booking.payment) {
      throw new AppError('Payment already exists for this booking', 400);
    }

    // Create payment intent
    const payment = await tx.payment.create({
      data: {
        bookingId,
        amount: booking.totalAmount,
        paymentMethod,
        status: 'PENDING',
      },
      include: {
        booking: true,
      },
    });

    return payment;
  });
};

const confirmPayment = async (paymentId, transactionId, collector, collectorId, bankReference) => {
  const generateTransactionId = require('../utils/generateTransactionId');
  
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.status === 'COMPLETED') {
      throw new AppError('Payment already completed', 400);
    }

    // Generate transaction ID if not provided
    let finalTransactionId = transactionId;
    if (!finalTransactionId) {
      // Generate unique transaction ID based on collector type
      const prefix = collector === 'BANK' ? 'BANK' : collector === 'ONLINE' ? 'ONLINE' : 'CASH';
      finalTransactionId = generateTransactionId(prefix);
      
      // Ensure uniqueness (retry if collision, though very unlikely)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.payment.findUnique({
          where: { transactionId: finalTransactionId },
        });
        if (!existing) break;
        finalTransactionId = generateTransactionId(prefix);
        attempts++;
      }
    } else {
      // Check if provided transaction ID already exists
      const existing = await tx.payment.findUnique({
        where: { transactionId: finalTransactionId },
      });
      if (existing && existing.id !== paymentId) {
        throw new AppError('Transaction ID already exists', 400);
      }
    }

    // Prepare update data
    const updateData = {
      status: 'COMPLETED',
      transactionId: finalTransactionId,
      paidAt: new Date(),
      collector,
    };

    // Add collector-specific information
    if (collector === 'CASHIER' && collectorId) {
      updateData.collectorId = collectorId;
    }

    if (collector === 'BANK' && bankReference) {
      updateData.bankReference = bankReference;
    }

    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // Confirm booking
    await confirmBooking(payment.bookingId);

    return updatedPayment;
  });
};

const failPayment = async (paymentId) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
      },
    });

    // Cancel booking (this will release seats)
    await cancelBooking(payment.bookingId, payment.booking.userId);

    return payment;
  });
};

const processRefund = async (paymentId) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.status !== 'COMPLETED') {
      throw new AppError('Payment is not completed', 400);
    }

    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
      },
    });

    return updatedPayment;
  });
};

// Get all transactions (Admin only)
const getAllTransactions = async (filters = {}) => {
  const where = {};

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by collector
  if (filters.collector) {
    where.collector = filters.collector;
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  // Filter by collector ID (for cashier)
  if (filters.collectorId) {
    where.collectorId = filters.collectorId;
  }

  const transactions = await prisma.payment.findMany({
    where,
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          schedule: {
            include: {
              bus: true,
              route: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch cashier information for transactions where collector is CASHIER
  const transactionsWithCashier = await Promise.all(
    transactions.map(async (transaction) => {
      if (transaction.collectorId && transaction.collector === 'CASHIER') {
        const cashier = await prisma.user.findUnique({
          where: { id: transaction.collectorId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        return {
          ...transaction,
          cashier,
        };
      }
      return transaction;
    })
  );

  return transactionsWithCashier;
};

// Get cashier's own transactions
const getCashierTransactions = async (cashierId, filters = {}) => {
  const where = {
    collectorId: cashierId,
    collector: 'CASHIER',
  };

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const transactions = await prisma.payment.findMany({
    where,
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          schedule: {
            include: {
              bus: true,
              route: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch cashier information for each transaction
  const transactionsWithCashier = await Promise.all(
    transactions.map(async (transaction) => {
      if (transaction.collectorId && transaction.collector === 'CASHIER') {
        const cashier = await prisma.user.findUnique({
          where: { id: transaction.collectorId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        return {
          ...transaction,
          cashier,
        };
      }
      return transaction;
    })
  );

  return transactionsWithCashier;
};

// Get transaction statistics
const getTransactionStats = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.collector) {
    where.collector = filters.collector;
  }

  if (filters.collectorId) {
    where.collectorId = filters.collectorId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const payments = await prisma.payment.findMany({
    where,
  });

  const totalTransactions = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedTransactions = payments.filter((p) => p.status === 'COMPLETED').length;
  const completedAmount = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  // Group by collector
  const byCollector = {};
  payments.forEach((payment) => {
    const collector = payment.collector || 'UNKNOWN';
    if (!byCollector[collector]) {
      byCollector[collector] = {
        count: 0,
        amount: 0,
      };
    }
    byCollector[collector].count++;
    byCollector[collector].amount += payment.amount;
  });

  // Group by status
  const byStatus = {};
  payments.forEach((payment) => {
    const status = payment.status;
    if (!byStatus[status]) {
      byStatus[status] = {
        count: 0,
        amount: 0,
      };
    }
    byStatus[status].count++;
    byStatus[status].amount += payment.amount;
  });

  return {
    summary: {
      totalTransactions,
      totalAmount,
      completedTransactions,
      completedAmount,
      averageAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
    },
    byCollector,
    byStatus,
  };
};

module.exports = {
  createPayment,
  confirmPayment,
  failPayment,
  processRefund,
  getAllTransactions,
  getCashierTransactions,
  getTransactionStats,
};

