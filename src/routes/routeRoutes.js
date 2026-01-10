const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createRouteSchema, searchRoutesSchema, updateRouteSchema } = require('../validations/route');

router.post('/', authenticate, authorize('ADMIN'), validate(createRouteSchema), routeController.createRoute);
router.get('/search', validate(searchRoutesSchema), routeController.searchRoutes);
router.get('/', routeController.getRoutes);
router.get('/:id', routeController.getRouteById);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateRouteSchema), routeController.updateRoute);

module.exports = router;

