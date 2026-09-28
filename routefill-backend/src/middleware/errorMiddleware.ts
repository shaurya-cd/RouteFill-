import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global centralized error handling middleware.
 * Maps application errors, database constraint violations, and validation failures to standard JSON error contracts.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Operational application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: formattedErrors,
      },
    });
    return;
  }

  // 3. Sequelize Unique Constraint error (e.g. duplicate email or truck number)
  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    res.status(409).json({
      success: false,
      error: {
        message: `Duplicate resource: A record with that ${fields.join(', ')} already exists.`,
        statusCode: 409,
      },
    });
    return;
  }

  // 4. Sequelize Validation error
  if (err instanceof SequelizeValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: err.errors[0]?.message || 'Database validation error',
        statusCode: 400,
      },
    });
    return;
  }

  // 5. Unhandled / internal server errors
  logger.error('Unhandled Internal Server Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      message: isProd ? 'An unexpected internal server error occurred' : (err?.message || 'Internal Server Error'),
      statusCode: 500,
      stack: isProd ? undefined : err?.stack,
    },
  });
}
