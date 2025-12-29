const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createBusSchema, updateBusSchema } = require('../validations/bus');

router.post('/', authenticate, authorize('ADMIN'), validate(createBusSchema), busController.createBus);
router.get('/', busController.getBuses);
router.get('/:id', busController.getBusById);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateBusSchema), busController.updateBus);
router.delete('/:id', authenticate, authorize('ADMIN'), busController.deleteBus);

module.exports = router;

