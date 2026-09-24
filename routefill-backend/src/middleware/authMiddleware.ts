import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, Role } from '../models';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware that verifies JWT bearer tokens
 * and hydrates the user entity with associated role permissions.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    const roles = (user.roles || []).map((r: any) => r.name);

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware that extracts user context if Bearer token is valid,
 * but allows requests to proceed unhindered if unauthenticated.
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      return next();
    }

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    });

    if (user && user.is_active) {
      const roles = (user.roles || []).map((r: any) => r.name);
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      };
    }

    next();
  } catch {
    next();
  }
}

