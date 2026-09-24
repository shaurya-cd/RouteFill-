import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';

export class ChatController {
  public async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loadId = parseInt(req.params.loadId, 10);
      const messages = await chatService.getMessages(loadId);
      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loadId = parseInt(req.params.loadId, 10);
      const senderId = req.user!.id;
      const { receiver_id, message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Message content is required' });
        return;
      }
      if (!receiver_id) {
        res.status(400).json({ success: false, message: 'receiver_id is required' });
        return;
      }

      const chatMsg = await chatService.sendMessage({
        loadId,
        senderId,
        receiverId: parseInt(receiver_id, 10),
        message,
        senderName: req.user!.name,
      });

      res.status(201).json({
        success: true,
        data: chatMsg,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
