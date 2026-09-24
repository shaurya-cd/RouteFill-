"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
/**
 * Controller handling platform administration, aggregate analytics, and ML model retraining triggers.
 */
class AdminController {
    /**
     * Triggers machine learning model retraining across all 4 models using the latest outcome records.
     */
    async retrainModels(req, res, next) {
        try {
            const result = await adminService_1.adminService.retrainModels();
            res.status(200).json({
                success: true,
                message: 'Model retraining triggered and completed successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Returns system-wide key performance indicators, freight counts, and empty-km reduction stats.
     */
    async getAnalytics(req, res, next) {
        try {
            const stats = await adminService_1.adminService.getPlatformAnalytics();
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves full list of registered platform actors.
     */
    async getAllUsers(req, res, next) {
        try {
            const users = await adminService_1.adminService.getAllUsers();
            res.status(200).json({
                success: true,
                count: users.length,
                data: users,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
