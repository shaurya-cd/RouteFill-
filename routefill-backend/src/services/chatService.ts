import { Op } from 'sequelize';
import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';
import { Load } from '../models/Load';
import { Truck } from '../models/Truck';
import { notificationService } from './notificationService';
import { NotificationTypeEnum } from '../models/Notification';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ChatService {
  public async getMessages(loadId: number, requestingUser?: { id: number; roles: string[] }): Promise<ChatMessage[]> {
    const load = await Load.findByPk(loadId, {
      include: [{ model: Truck, as: 'assignedTruck' }],
    });

    if (!load) {
      throw new NotFoundError(`Load with ID ${loadId} not found`);
    }

    if (requestingUser) {
      const isAdmin = requestingUser.roles.includes('ADMIN');
      const isPoster = load.poster_id === requestingUser.id;
      const isAssignedCarrier = load.assignedTruck?.owner_id === requestingUser.id;

      if (!isAdmin && !isPoster && !isAssignedCarrier) {
        // Check if user was a participant in messages on this load
        const participationCount = await ChatMessage.count({
          where: {
            load_id: loadId,
            [Op.or]: [{ sender_id: requestingUser.id }, { receiver_id: requestingUser.id }],
          },
        });

        if (participationCount === 0) {
          // Allow read only if load is open for inquiries
          if (load.status !== 'AVAILABLE' && load.status !== 'RESERVED') {
            throw new ForbiddenError('Unauthorized to view private messages for this shipment');
          }
        }
      }
    }

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
    const load = await Load.findByPk(payload.loadId);
    if (!load) {
      throw new NotFoundError(`Load with ID ${payload.loadId} not found`);
    }

    const receiver = await User.findByPk(payload.receiverId);
    if (!receiver) {
      throw new NotFoundError(`Recipient user ID ${payload.receiverId} not found`);
    }

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
