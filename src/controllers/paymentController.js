const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

const createPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    const payment = await paymentService.createPayment(bookingId, paymentMethod);
    successResponse(res, payment, 'Payment intent created', 201);
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId, collector, bankReference } = req.body;
    
    // Only CASHIER or ADMIN can confirm payments
    if (req.user.role !== 'CASHIER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only cashiers and admins can confirm payments',
      });
    }

    // If collector is CASHIER, use the current user's ID
    const collectorId = collector === 'CASHIER' ? req.user.id : null;

    // Transaction ID is optional - will be auto-generated if not provided
    const payment = await paymentService.confirmPayment(
      paymentId,
      transactionId || null, // Pass null if not provided, service will generate
      collector || 'CASHIER',
      collectorId,
      bankReference
    );
    
    successResponse(res, payment, 'Payment confirmed successfully');
  } catch (error) {
    next(error);
  }
};

const webhookPayment = async (req, res, next) => {
  try {
    // This is a placeholder for webhook handling
    // In production, verify webhook signature here
    const { paymentId, status, transactionId } = req.body;

    if (status === 'success' || status === 'completed') {
      // Webhook payments are from online sources
      await paymentService.confirmPayment(paymentId, transactionId, 'ONLINE', null, null);
    } else if (status === 'failed') {
      await paymentService.failPayment(paymentId);
    }

    successResponse(res, null, 'Webhook processed');
  } catch (error) {
    next(error);
  }
};

// Get all transactions (Admin only)
const getAllTransactions = async (req, res, next) => {
  try {
    const { status, collector, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (collector) filters.collector = collector;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const transactions = await paymentService.getAllTransactions(filters);
    successResponse(res, transactions, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get transaction statistics (Admin only)
const getTransactionStats = async (req, res, next) => {
  try {
    const { status, collector, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (collector) filters.collector = collector;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await paymentService.getTransactionStats(filters);
    successResponse(res, stats, 'Transaction statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get cashier's own transactions
const getMyTransactions = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const transactions = await paymentService.getCashierTransactions(req.user.id, filters);
    successResponse(res, transactions, 'Your transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get cashier's transaction statistics
const getMyTransactionStats = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const filters = {
      collectorId: req.user.id,
      collector: 'CASHIER',
    };
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await paymentService.getTransactionStats(filters);
    successResponse(res, stats, 'Your transaction statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  webhookPayment,
  getAllTransactions,
  getTransactionStats,
  getMyTransactions,
  getMyTransactionStats,
};

