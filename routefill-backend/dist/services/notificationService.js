"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
class NotificationService {
    async createNotification(payload) {
        return Notification_1.Notification.create({
            user_id: payload.userId,
            title: payload.title,
            message: payload.message,
            type: payload.type || Notification_1.NotificationTypeEnum.SYSTEM,
            data: payload.data || null,
            is_read: false,
        });
    }
    async getUserNotifications(userId, limit = 20) {
        return Notification_1.Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit,
        });
    }
    async markAsRead(id, userId) {
        const [affected] = await Notification_1.Notification.update({ is_read: true }, { where: { id, user_id: userId } });
        return affected > 0;
    }
    async markAllAsRead(userId) {
        const [affected] = await Notification_1.Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
        return affected;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
