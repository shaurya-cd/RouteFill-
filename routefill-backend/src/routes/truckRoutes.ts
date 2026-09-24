import { Router } from 'express';
import { truckController } from '../controllers/truckController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { createTruckSchema, updateTruckSchema } from '../validators/truckValidator';

const router = Router();

/**
 * @swagger
 * /api/trucks:
 *   get:
 *     summary: Retrieve registered platform fleet vehicles
 *     tags: [Trucks]
 */
router.get('/', optionalAuthenticate, truckController.getTrucks);

/**
 * @swagger
 * /api/trucks/{id}:
 *   get:
 *     summary: Get single truck details by ID
 *     tags: [Trucks]
 */
router.get('/:id', optionalAuthenticate, truckController.getTruckById);

/**
 * @swagger
 * /api/trucks:
 *   post:
 *     summary: Register a new truck
 *     tags: [Trucks]
 */
router.post(
  '/',
  optionalAuthenticate,
  validateRequest({ body: createTruckSchema }),
  truckController.createTruck
);

/**
 * Protected Truck Modification & Deletion Routes
 */
router.use(authenticate);

/**
 * @swagger
 * /api/trucks/{id}:
 *   patch:
 *     summary: Update truck status or capacity
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  requireRole('TRUCK_OWNER'),
  validateRequest({ body: updateTruckSchema }),
  truckController.updateTruck
);

/**
 * @swagger
 * /api/trucks/{id}:
 *   delete:
 *     summary: Delete a vehicle from fleet
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireRole('TRUCK_OWNER'), truckController.deleteTruck);

export default router;
