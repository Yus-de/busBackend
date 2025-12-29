const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createPaymentSchema, confirmPaymentSchema, webhookPaymentSchema } = require('../validations/payment');
const { getTransactionsSchema } = require('../validations/transaction');

// Payment operations
router.post('/', authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.post('/confirm', authenticate, validate(confirmPaymentSchema), paymentController.confirmPayment);
router.post('/webhook', validate(webhookPaymentSchema), paymentController.webhookPayment);

// Admin routes - View all transactions
router.get('/transactions', authenticate, authorize('ADMIN'), validate(getTransactionsSchema), paymentController.getAllTransactions);
router.get('/transactions/stats', authenticate, authorize('ADMIN'), validate(getTransactionsSchema), paymentController.getTransactionStats);

// Cashier routes - View own transactions
router.get('/my/transactions', authenticate, authorize('CASHIER'), validate(getTransactionsSchema), paymentController.getMyTransactions);
router.get('/my/transactions/stats', authenticate, authorize('CASHIER'), validate(getTransactionsSchema), paymentController.getMyTransactionStats);

module.exports = router;

