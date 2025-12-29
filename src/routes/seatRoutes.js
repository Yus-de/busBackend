const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const validate = require('../middlewares/validate');
const { getSeatAvailabilitySchema } = require('../validations/seat');

router.get('/availability', validate(getSeatAvailabilitySchema), seatController.getSeatAvailability);

module.exports = router;

