"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const sequelize_1 = require("sequelize");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Global centralized error handling middleware.
 * Maps application errors, database constraint violations, and validation failures to standard JSON error contracts.
 */
function errorHandler(err, req, res, next) {
    // 1. Operational application errors
    if (err instanceof errors_1.AppError) {
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
    if (err instanceof zod_1.ZodError) {
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
    if (err instanceof sequelize_1.UniqueConstraintError) {
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
    if (err instanceof sequelize_1.ValidationError) {
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
    logger_1.logger.error('Unhandled Internal Server Error:', err);
    res.status(500).json({
        success: false,
        error: {
            message: err?.message || 'Internal Server Error',
            statusCode: 500,
            stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
        },
    });
}
