"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const models_1 = require("../models");
const Role_1 = require("../models/Role");
const errors_1 = require("../utils/errors");
/**
 * Handles identity lifecycle, credential verification, and JSON Web Token issuance.
 */
class AuthService {
    /**
     * Registers a new platform user, hashes password via bcrypt, and assigns specified system role.
     */
    async register(dto) {
        const existing = await models_1.User.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new errors_1.ConflictError('A user with this email address already exists');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(dto.password, salt);
        const user = await models_1.User.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password_hash: passwordHash,
            is_active: true,
        });
        // Assign role
        const targetRoleName = dto.role || Role_1.UserRoleEnum.TRUCK_OWNER;
        let role = await models_1.Role.findOne({ where: { name: targetRoleName } });
        if (!role) {
            role = await models_1.Role.create({
                name: targetRoleName,
                description: `Default role for ${targetRoleName}`,
            });
        }
        await models_1.UserRole.create({
            user_id: user.id,
            role_id: role.id,
        });
        const token = this.generateToken(user.id, user.email, [targetRoleName]);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles: [targetRoleName],
            },
            token,
        };
    }
    /**
     * Validates user credentials against bcrypt hashes and generates an authenticated JWT session token.
     */
    async login(email, password) {
        const user = await models_1.User.findOne({
            where: { email },
            include: [{ model: models_1.Role, as: 'roles', attributes: ['name'] }],
        });
        if (!user || !user.is_active) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isMatch = await user.validatePassword(password);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Record login timestamp
        user.last_login_at = new Date();
        await user.save();
        const roles = (user.roles || []).map((r) => r.name);
        const token = this.generateToken(user.id, user.email, roles);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles,
                last_login_at: user.last_login_at,
                last_logout_at: user.last_logout_at,
            },
            token,
        };
    }
    /**
     * Records user session termination and saves logout timestamp.
     */
    async logout(userId) {
        const user = await models_1.User.findByPk(userId);
        if (user) {
            user.last_logout_at = new Date();
            await user.save();
        }
        return { success: true, message: 'User session logged out successfully' };
    }
    /**
     * Retrieves profile details and assigned authorizations for an authenticated user ID.
     */
    async getProfile(userId) {
        const user = await models_1.User.findByPk(userId, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: models_1.Role, as: 'roles', attributes: ['name', 'description'] }],
        });
        if (!user) {
            throw new errors_1.NotFoundError('User profile not found');
        }
        return user;
    }
    /**
     * Helper constructing signed JWT tokens embedding user claims and expiration window.
     */
    generateToken(userId, email, roles) {
        return jsonwebtoken_1.default.sign({ userId, email, roles }, env_1.ENV.JWT_SECRET, { expiresIn: env_1.ENV.JWT_EXPIRES_IN });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
