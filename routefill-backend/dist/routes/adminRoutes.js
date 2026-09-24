"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, roleMiddleware_1.requireRole)('ADMIN'));
/**
 * @swagger
 * /api/admin/ml/retrain:
 *   post:
 *     summary: Trigger machine learning model retraining across all 4 models
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.post('/ml/retrain', adminController_1.adminController.retrainModels);
/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Retrieve aggregate platform KPI metrics and AI impact statistics
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics', adminController_1.adminController.getAnalytics);
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all registered platform users and roles
 *     tags: [Admin / ML]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', adminController_1.adminController.getAllUsers);
exports.default = router;
