import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';

/**
 * Controller handling platform administration, aggregate analytics, and ML model retraining triggers.
 */
export class AdminController {
  /**
   * Triggers machine learning model retraining across all 4 models using the latest outcome records.
   */
  public async retrainModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.retrainModels();
      res.status(200).json({
        success: true,
        message: 'Model retraining triggered and completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns system-wide key performance indicators, freight counts, and empty-km reduction stats.
   */
  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getPlatformAnalytics();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves full list of registered platform actors.
   */
  public async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
