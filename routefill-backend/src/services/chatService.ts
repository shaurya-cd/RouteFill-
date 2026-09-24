import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';
import { notificationService } from './notificationService';
import { NotificationTypeEnum } from '../models/Notification';

export class ChatService {
  public async getMessages(loadId: number): Promise<ChatMessage[]> {
    return ChatMessage.findAll({
      where: { load_id: loadId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  public async sendMessage(payload: {
    loadId: number;
    senderId: number;
    receiverId: number;
    message: string;
    senderName?: string;
  }): Promise<ChatMessage> {
    const chatMsg = await ChatMessage.create({
      load_id: payload.loadId,
      sender_id: payload.senderId,
      receiver_id: payload.receiverId,
      message: payload.message.trim(),
    });

    // Notify receiver about new chat message
    await notificationService.createNotification({
      userId: payload.receiverId,
      title: `Message from ${payload.senderName || 'Fleet Partner'}`,
      message: payload.message.length > 80 ? `${payload.message.substring(0, 80)}...` : payload.message,
      type: NotificationTypeEnum.CHAT_MESSAGE,
      data: {
        load_id: payload.loadId,
        sender_id: payload.senderId,
        message_id: chatMsg.id,
      },
    }).catch((err) => console.warn('Notification creation error:', err));

    return chatMsg;
  }
}

export const chatService = new ChatService();
