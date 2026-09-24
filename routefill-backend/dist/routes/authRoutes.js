"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const authValidator_1 = require("../validators/authValidator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 */
router.post('/register', (0, validateMiddleware_1.validateRequest)({ body: authValidator_1.registerSchema }), authController_1.authController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user credentials and retrieve JWT
 *     tags: [Authentication]
 */
router.post('/login', (0, validateMiddleware_1.validateRequest)({ body: authValidator_1.loginSchema }), authController_1.authController.login);
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retrieve currently authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authMiddleware_1.authenticate, authController_1.authController.getMe);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Terminate currently authenticated user session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authMiddleware_1.authenticate, authController_1.authController.logout);
exports.default = router;
