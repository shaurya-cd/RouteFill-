import { Router } from 'express';
import { loadController } from '../controllers/loadController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { createLoadSchema, updateLoadSchema, nearbyLoadsQuerySchema } from '../validators/loadValidator';

const router = Router();

/**
 * @swagger
 * /api/loads/nearby:
 *   get:
 *     summary: Find available loads within geographic radius
 *     tags: [Loads]
 */
router.get(
  '/nearby',
  validateRequest({ query: nearbyLoadsQuerySchema }),
  loadController.findNearbyLoads
);

/**
 * @swagger
 * /api/loads:
 *   get:
 *     summary: List loads with optional status and poster filtering
 *     tags: [Loads]
 */
router.get('/', optionalAuthenticate, loadController.getLoads);

/**
 * @swagger
 * /api/loads/{id}:
 *   get:
 *     summary: Retrieve single load by ID
 *     tags: [Loads]
 */
router.get('/:id', loadController.getLoadById);

// Protected routes below
router.use(authenticate);

/**
 * @swagger
 * /api/loads:
 *   post:
 *     summary: Post a new freight load
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requireRole('LOAD_POSTER', 'TRUCK_OWNER'),
  validateRequest({ body: createLoadSchema }),
  loadController.createLoad
);

/**
 * @swagger
 * /api/loads/{id}:
 *   patch:
 *     summary: Update load details or status
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  validateRequest({ body: updateLoadSchema }),
  loadController.updateLoad
);

/**
 * @swagger
 * /api/loads/{id}/accept:
 *   post:
 *     summary: Accept a load for a carrier truck and notify shipper
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/accept',
  loadController.acceptLoad
);

/**
 * @swagger
 * /api/loads/{id}:
 *   delete:
 *     summary: Cancel or remove a posted load
 *     tags: [Loads]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', loadController.deleteLoad);

export default router;
