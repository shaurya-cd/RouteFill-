import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { registerSchema, loginSchema } from '../validators/authValidator';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 */
router.post('/register', validateRequest({ body: registerSchema }), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user credentials and retrieve JWT
 *     tags: [Authentication]
 */
router.post('/login', validateRequest({ body: loginSchema }), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retrieve currently authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Terminate currently authenticated user session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, authController.logout);

export default router;
