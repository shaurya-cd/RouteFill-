import { Notification, NotificationTypeEnum } from '../models/Notification';

export class NotificationService {
  public async createNotification(payload: {
    userId: number;
    title: string;
    message: string;
    type?: NotificationTypeEnum;
    data?: any;
  }): Promise<Notification> {
    return Notification.create({
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || NotificationTypeEnum.SYSTEM,
      data: payload.data || null,
      is_read: false,
    });
  }

  public async getUserNotifications(userId: number, limit = 20): Promise<Notification[]> {
    return Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  public async markAsRead(id: number, userId: number): Promise<boolean> {
    const [affected] = await Notification.update(
      { is_read: true },
      { where: { id, user_id: userId } }
    );
    return affected > 0;
  }

  public async markAllAsRead(userId: number): Promise<number> {
    const [affected] = await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
    return affected;
  }
}

export const notificationService = new NotificationService();
