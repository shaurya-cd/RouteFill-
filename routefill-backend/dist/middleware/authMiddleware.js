"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
/**
 * Authentication middleware that verifies JWT bearer tokens
 * and hydrates the user entity with associated role permissions.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Missing or malformed Authorization header');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        }
        catch (err) {
            throw new errors_1.UnauthorizedError('Invalid or expired authentication token');
        }
        const user = await models_1.User.findByPk(decoded.userId, {
            include: [{ model: models_1.Role, as: 'roles', attributes: ['name'] }],
        });
        if (!user || !user.is_active) {
            throw new errors_1.UnauthorizedError('User account not found or deactivated');
        }
        const roles = (user.roles || []).map((r) => r.name);
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            roles,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Optional authentication middleware that extracts user context if Bearer token is valid,
 * but allows requests to proceed unhindered if unauthenticated.
 */
async function optionalAuthenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        }
        catch {
            return next();
        }
        const user = await models_1.User.findByPk(decoded.userId, {
            include: [{ model: models_1.Role, as: 'roles', attributes: ['name'] }],
        });
        if (user && user.is_active) {
            const roles = (user.roles || []).map((r) => r.name);
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                roles,
            };
        }
        next();
    }
    catch {
        next();
    }
}
