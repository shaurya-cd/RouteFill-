import { Router } from 'express';
import { recommendationController } from '../controllers/recommendationController';
import { optionalAuthenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { recordOutcomeSchema } from '../validators/recommendationValidator';

const router = Router();

router.use(optionalAuthenticate);

/**
 * @swagger
 * /api/recommendations/generate/{truckId}:
 *   post:
 *     summary: Generate intelligent AI return-load recommendations for a truck
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate/:truckId', recommendationController.generateRecommendations);

/**
 * @swagger
 * /api/recommendations/truck/{truckId}:
 *   get:
 *     summary: Retrieve existing recommendations for a truck
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/truck/:truckId', recommendationController.getRecommendationsForTruck);

/**
 * @swagger
 * /api/recommendations/{id}:
 *   get:
 *     summary: Retrieve single recommendation details
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', recommendationController.getRecommendationById);

/**
 * @swagger
 * /api/recommendations/{id}/outcome:
 *   post:
 *     summary: Record actual feedback outcome for an AI recommendation (retraining feedback loop)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/outcome',
  validateRequest({ body: recordOutcomeSchema }),
  recommendationController.recordOutcome
);

export default router;
