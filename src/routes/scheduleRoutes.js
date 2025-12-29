const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createScheduleSchema, getSchedulesSchema } = require('../validations/schedule');

router.post('/', authenticate, authorize('ADMIN'), validate(createScheduleSchema), scheduleController.createSchedule);
router.get('/', validate(getSchedulesSchema), scheduleController.getSchedules);

module.exports = router;

