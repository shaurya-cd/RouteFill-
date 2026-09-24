"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tripController_1 = require("../controllers/tripController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const tripValidator_1 = require("../validators/tripValidator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Schedule a new line-haul trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, validateMiddleware_1.validateRequest)({ body: tripValidator_1.createTripSchema }), tripController_1.tripController.createTrip);
/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieve line-haul trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', tripController_1.tripController.getTrips);
/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Retrieve trip details by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', tripController_1.tripController.getTripById);
/**
 * @swagger
 * /api/trips/{id}:
 *   patch:
 *     summary: Update trip status (Completion triggers dead-mileage detection)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', (0, validateMiddleware_1.validateRequest)({ body: tripValidator_1.updateTripSchema }), tripController_1.tripController.updateTrip);
exports.default = router;
