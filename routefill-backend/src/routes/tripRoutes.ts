import { Router } from 'express';
import { tripController } from '../controllers/tripController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { createTripSchema, updateTripSchema } from '../validators/tripValidator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Schedule a new line-haul trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validateRequest({ body: createTripSchema }), tripController.createTrip);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieve line-haul trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', tripController.getTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Retrieve trip details by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', tripController.getTripById);

/**
 * @swagger
 * /api/trips/{id}:
 *   patch:
 *     summary: Update trip status (Completion triggers dead-mileage detection)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validateRequest({ body: updateTripSchema }), tripController.updateTrip);

export default router;
