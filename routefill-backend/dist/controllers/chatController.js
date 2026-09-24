"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = exports.ChatController = void 0;
const chatService_1 = require("../services/chatService");
class ChatController {
    async getMessages(req, res, next) {
        try {
            const loadId = parseInt(req.params.loadId, 10);
            const messages = await chatService_1.chatService.getMessages(loadId);
            res.status(200).json({
                success: true,
                count: messages.length,
                data: messages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendMessage(req, res, next) {
        try {
            const loadId = parseInt(req.params.loadId, 10);
            const senderId = req.user.id;
            const { receiver_id, message } = req.body;
            if (!message || !message.trim()) {
                res.status(400).json({ success: false, message: 'Message content is required' });
                return;
            }
            if (!receiver_id) {
                res.status(400).json({ success: false, message: 'receiver_id is required' });
                return;
            }
            const chatMsg = await chatService_1.chatService.sendMessage({
                loadId,
                senderId,
                receiverId: parseInt(receiver_id, 10),
                message,
                senderName: req.user.name,
            });
            res.status(201).json({
                success: true,
                data: chatMsg,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChatController = ChatController;
exports.chatController = new ChatController();
