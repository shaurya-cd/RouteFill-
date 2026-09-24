"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
/**
 * Custom application error hierarchy for standardized HTTP exception handling.
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Invalid request parameters') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required or token expired') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden: Insufficient role permissions') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Requested resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict or duplicate entry') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
