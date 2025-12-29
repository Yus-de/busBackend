const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

router.get('/me', authenticate, userController.getMe);
router.get('/bookings', authenticate, userController.getMyBookings);

module.exports = router;

