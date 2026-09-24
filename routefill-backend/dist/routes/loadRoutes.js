"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loadController_1 = require("../controllers/loadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const loadValidator_1 = require("../validators/loadValidator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/loads/nearby:
 *   get:
 *     summary: Find available loads within geographic radius
 *     tags: [Loads]
 */
router.get('/nearby', (0, validateMiddleware_1.validateRequest)({ query: loadValidator_1.nearbyLoadsQuerySchema }), loadController_1.loadController.findNearbyLoads);
/**
 * @swagger
 * /api/loads:
 *   get:
 *     summary: List loads with optional status and poster filtering
 *     tags: [Loads]
 */
router.get('/', authMiddleware_1.optionalAuthenticate, loadController_1.loadController.getLoads);
/**
 * @swagger
 * /api/loads/{id}:
 *   get:
 *     summary: Retrieve single load by ID
 *     tags: [Loads]
 */
router.get('/:id', loadController_1.loadController.getLoadById);
// Protected routes below
router.use(authMiddleware_1.authenticate);
/**
 * @swagger
 * /api/loads:
 *   post:
 *     summary: Post a new freight load
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (0, roleMiddleware_1.requireRole)('LOAD_POSTER', 'TRUCK_OWNER'), (0, validateMiddleware_1.validateRequest)({ body: loadValidator_1.createLoadSchema }), loadController_1.loadController.createLoad);
/**
 * @swagger
 * /api/loads/{id}:
 *   patch:
 *     summary: Update load details or status
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', (0, validateMiddleware_1.validateRequest)({ body: loadValidator_1.updateLoadSchema }), loadController_1.loadController.updateLoad);
/**
 * @swagger
 * /api/loads/{id}/accept:
 *   post:
 *     summary: Accept a load for a carrier truck and notify shipper
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/accept', loadController_1.loadController.acceptLoad);
/**
 * @swagger
 * /api/loads/{id}:
 *   delete:
 *     summary: Cancel or remove a posted load
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', loadController_1.loadController.deleteLoad);
exports.default = router;
