"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const ChatMessage_1 = require("../models/ChatMessage");
const User_1 = require("../models/User");
const notificationService_1 = require("./notificationService");
const Notification_1 = require("../models/Notification");
class ChatService {
    async getMessages(loadId) {
        return ChatMessage_1.ChatMessage.findAll({
            where: { load_id: loadId },
            include: [
                { model: User_1.User, as: 'sender', attributes: ['id', 'name', 'email'] },
                { model: User_1.User, as: 'receiver', attributes: ['id', 'name', 'email'] },
            ],
            order: [['created_at', 'ASC']],
        });
    }
    async sendMessage(payload) {
        const chatMsg = await ChatMessage_1.ChatMessage.create({
            load_id: payload.loadId,
            sender_id: payload.senderId,
            receiver_id: payload.receiverId,
            message: payload.message.trim(),
        });
        // Notify receiver about new chat message
        await notificationService_1.notificationService.createNotification({
            userId: payload.receiverId,
            title: `Message from ${payload.senderName || 'Fleet Partner'}`,
            message: payload.message.length > 80 ? `${payload.message.substring(0, 80)}...` : payload.message,
            type: Notification_1.NotificationTypeEnum.CHAT_MESSAGE,
            data: {
                load_id: payload.loadId,
                sender_id: payload.senderId,
                message_id: chatMsg.id,
            },
        }).catch((err) => console.warn('Notification creation error:', err));
        return chatMsg;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
