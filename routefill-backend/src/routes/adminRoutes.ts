import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * /api/admin/ml/retrain:
 *   post:
 *     summary: Trigger machine learning model retraining across all 4 models
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.post('/ml/retrain', adminController.retrainModels);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Retrieve aggregate platform KPI metrics and AI impact statistics
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all registered platform users and roles
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', adminController.getAllUsers);

export default router;
