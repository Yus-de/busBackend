const express = require('express');
const router = express.Router();
const cashierController = require('../controllers/cashierController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createCashierSchema,
  updateCashierSchema,
  getCashierSchema,
} = require('../validations/cashier');

// Admin routes for managing cashiers
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  cashierController.getAllCashiers
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(getCashierSchema),
  cashierController.getCashierById
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCashierSchema),
  cashierController.createCashier
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCashierSchema),
  cashierController.updateCashier
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(getCashierSchema),
  cashierController.deleteCashier
);

router.get(
  '/:id/stats',
  authenticate,
  authorize('ADMIN'),
  validate(getCashierSchema),
  cashierController.getCashierStats
);

// Cashier routes for their own profile
router.get('/me/profile', authenticate, authorize('CASHIER'), cashierController.getMyProfile);
router.get('/me/stats', authenticate, authorize('CASHIER'), cashierController.getMyStats);

module.exports = router;

