/**
 * Custom application error hierarchy for standardized HTTP exception handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or token expired') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: Insufficient role permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate entry') {
    super(message, 409);
  }
}
