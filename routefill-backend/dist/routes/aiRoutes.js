"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
/**
 * @swagger
 * /api/ai/dead-mileage/predict:
 *   post:
 *     summary: Predict dead mileage probability and empty distance for a truck/trip
 *     tags: [Dead Mileage AI]
 *     security:
 *       - bearerAuth: []
 */
router.post('/dead-mileage/predict', aiController_1.aiController.predictDeadMileageRisk);
exports.default = router;
