"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const recommendationValidator_1 = require("../validators/recommendationValidator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.optionalAuthenticate);
/**
 * @swagger
 * /api/recommendations/generate/{truckId}:
 *   post:
 *     summary: Generate intelligent AI return-load recommendations for a truck
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate/:truckId', recommendationController_1.recommendationController.generateRecommendations);
/**
 * @swagger
 * /api/recommendations/truck/{truckId}:
 *   get:
 *     summary: Retrieve existing recommendations for a truck
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/truck/:truckId', recommendationController_1.recommendationController.getRecommendationsForTruck);
/**
 * @swagger
 * /api/recommendations/{id}:
 *   get:
 *     summary: Retrieve single recommendation details
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', recommendationController_1.recommendationController.getRecommendationById);
/**
 * @swagger
 * /api/recommendations/{id}/outcome:
 *   post:
 *     summary: Record actual feedback outcome for an AI recommendation (retraining feedback loop)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/outcome', (0, validateMiddleware_1.validateRequest)({ body: recommendationValidator_1.recordOutcomeSchema }), recommendationController_1.recommendationController.recordOutcome);
exports.default = router;
