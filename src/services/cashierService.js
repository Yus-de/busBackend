const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { NotFoundError, AppError } = require('../utils/errors');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Get all cashiers
const getAllCashiers = async () => {
  return await prisma.user.findMany({
    where: {
      role: 'CASHIER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get cashier by ID
const getCashierById = async (cashierId) => {
  const cashier = await prisma.user.findFirst({
    where: {
      id: cashierId,
      role: 'CASHIER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!cashier) {
    throw new NotFoundError('Cashier');
  }

  return cashier;
};

// Create cashier
const createCashier = async (cashierData) => {
  const { email, password, name, phone } = cashierData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create cashier
  const cashier = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'CASHIER',
      emailVerified: true, // Cashiers are created by admin, so pre-verified
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return cashier;
};

// Update cashier
const updateCashier = async (cashierId, updateData) => {
  // Check if cashier exists
  const existingCashier = await prisma.user.findFirst({
    where: {
      id: cashierId,
      role: 'CASHIER',
    },
  });

  if (!existingCashier) {
    throw new NotFoundError('Cashier');
  }

  // If email is being updated, check for duplicates
  if (updateData.email && updateData.email !== existingCashier.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: updateData.email },
    });

    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Hash password if provided
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  // Update cashier
  const cashier = await prisma.user.update({
    where: { id: cashierId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      updatedAt: true,
    },
  });

  return cashier;
};

// Delete cashier
const deleteCashier = async (cashierId) => {
  // Check if cashier exists
  const cashier = await prisma.user.findFirst({
    where: {
      id: cashierId,
      role: 'CASHIER',
    },
  });

  if (!cashier) {
    throw new NotFoundError('Cashier');
  }

  // Delete cashier
  await prisma.user.delete({
    where: { id: cashierId },
  });

  return { message: 'Cashier deleted successfully' };
};

// Get cashier statistics
const getCashierStats = async (cashierId) => {
  const cashier = await prisma.user.findFirst({
    where: {
      id: cashierId,
      role: 'CASHIER',
    },
  });

  if (!cashier) {
    throw new NotFoundError('Cashier');
  }

  // Get payment statistics
  const payments = await prisma.payment.findMany({
    where: {
      collectorId: cashierId,
      collector: 'CASHIER',
    },
  });

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = payments.filter((p) => p.status === 'COMPLETED').length;

  return {
    cashier: {
      id: cashier.id,
      name: cashier.name,
      email: cashier.email,
    },
    stats: {
      totalPayments,
      completedPayments,
      totalAmount,
      averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
    },
  };
};

module.exports = {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
  getCashierStats,
};

