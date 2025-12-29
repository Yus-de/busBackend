const cashierService = require('../services/cashierService');
const { successResponse } = require('../utils/response');

// Get all cashiers (Admin only)
const getAllCashiers = async (req, res, next) => {
  try {
    const cashiers = await cashierService.getAllCashiers();
    successResponse(res, cashiers, 'Cashiers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get cashier by ID (Admin only)
const getCashierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cashier = await cashierService.getCashierById(id);
    successResponse(res, cashier, 'Cashier retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Create cashier (Admin only)
const createCashier = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    const cashier = await cashierService.createCashier({
      email,
      password,
      name,
      phone,
    });
    successResponse(res, cashier, 'Cashier created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Update cashier (Admin only)
const updateCashier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const cashier = await cashierService.updateCashier(id, updateData);
    successResponse(res, cashier, 'Cashier updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete cashier (Admin only)
const deleteCashier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await cashierService.deleteCashier(id);
    successResponse(res, result, 'Cashier deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get cashier statistics (Admin only)
const getCashierStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await cashierService.getCashierStats(id);
    successResponse(res, stats, 'Cashier statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get current cashier profile (Cashier only)
const getMyProfile = async (req, res, next) => {
  try {
    const cashier = await cashierService.getCashierById(req.user.id);
    successResponse(res, cashier, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get my statistics (Cashier only)
const getMyStats = async (req, res, next) => {
  try {
    const stats = await cashierService.getCashierStats(req.user.id);
    successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
  getCashierStats,
  getMyProfile,
  getMyStats,
};

