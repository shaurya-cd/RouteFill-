"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
class NotificationController {
    async getMyNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
            const notifications = await notificationService_1.notificationService.getUserNotifications(userId, limit);
            const unreadCount = notifications.filter((n) => !n.is_read).length;
            res.status(200).json({
                success: true,
                unread_count: unreadCount,
                data: notifications,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const userId = req.user.id;
            const success = await notificationService_1.notificationService.markAsRead(id, userId);
            res.status(200).json({
                success,
                message: success ? 'Notification marked as read' : 'Notification not found',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService_1.notificationService.markAllAsRead(userId);
            res.status(200).json({
                success: true,
                marked_count: count,
                message: 'All notifications marked as read',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
