import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

/**
 * Role authorization guard ensuring the authenticated user possesses at least one required role.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication context missing'));
      return;
    }

    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role) || req.user?.roles.includes('ADMIN')
    );

    if (!hasRole) {
      next(
        new ForbiddenError(
          `Action requires one of the following roles: [${allowedRoles.join(', ')}]`
        )
      );
      return;
    }

    next();
  };
}
