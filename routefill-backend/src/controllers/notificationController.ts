import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';

export class NotificationController {
  public async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const notifications = await notificationService.getUserNotifications(userId, limit);
      const unreadCount = notifications.filter((n) => !n.is_read).length;

      res.status(200).json({
        success: true,
        unread_count: unreadCount,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const success = await notificationService.markAsRead(id, userId);

      res.status(200).json({
        success,
        message: success ? 'Notification marked as read' : 'Notification not found',
      });
    } catch (error) {
      next(error);
    }
  }

  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        marked_count: count,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
