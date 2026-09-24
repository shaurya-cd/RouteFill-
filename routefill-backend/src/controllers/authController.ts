import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

/**
 * Controller managing user authentication, registration, and profile queries.
 */
export class AuthController {
  /**
   * Registers a new user with email, password, and assigned role.
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticates user credentials and returns a signed JWT token.
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns current authenticated user profile and roles.
   */
  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out the currently authenticated user session.
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await authService.logout(req.user.id);
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

