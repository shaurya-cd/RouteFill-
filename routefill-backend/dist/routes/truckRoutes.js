"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const truckController_1 = require("../controllers/truckController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const truckValidator_1 = require("../validators/truckValidator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/trucks:
 *   get:
 *     summary: Retrieve registered platform fleet vehicles
 *     tags: [Trucks]
 */
router.get('/', authMiddleware_1.optionalAuthenticate, truckController_1.truckController.getTrucks);
/**
 * @swagger
 * /api/trucks/{id}:
 *   get:
 *     summary: Get single truck details by ID
 *     tags: [Trucks]
 */
router.get('/:id', authMiddleware_1.optionalAuthenticate, truckController_1.truckController.getTruckById);
/**
 * @swagger
 * /api/trucks:
 *   post:
 *     summary: Register a new truck
 *     tags: [Trucks]
 */
router.post('/', authMiddleware_1.optionalAuthenticate, (0, validateMiddleware_1.validateRequest)({ body: truckValidator_1.createTruckSchema }), truckController_1.truckController.createTruck);
/**
 * Protected Truck Modification & Deletion Routes
 */
router.use(authMiddleware_1.authenticate);
/**
 * @swagger
 * /api/trucks/{id}:
 *   patch:
 *     summary: Update truck status or capacity
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', (0, roleMiddleware_1.requireRole)('TRUCK_OWNER'), (0, validateMiddleware_1.validateRequest)({ body: truckValidator_1.updateTruckSchema }), truckController_1.truckController.updateTruck);
/**
 * @swagger
 * /api/trucks/{id}:
 *   delete:
 *     summary: Delete a vehicle from fleet
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (0, roleMiddleware_1.requireRole)('TRUCK_OWNER'), truckController_1.truckController.deleteTruck);
exports.default = router;
