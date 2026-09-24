import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/ai/dead-mileage/predict:
 *   post:
 *     summary: Predict dead mileage probability and empty distance for a truck/trip
 *     tags: [Dead Mileage AI]
 *     security:
 *       - bearerAuth: []
 */
router.post('/dead-mileage/predict', aiController.predictDeadMileageRisk);

export default router;
