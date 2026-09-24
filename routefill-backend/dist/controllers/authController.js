"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_1 = require("../services/authService");
/**
 * Controller managing user authentication, registration, and profile queries.
 */
class AuthController {
    /**
     * Registers a new user with email, password, and assigned role.
     */
    async register(req, res, next) {
        try {
            const result = await authService_1.authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Authenticates user credentials and returns a signed JWT token.
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService_1.authService.login(email, password);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Returns current authenticated user profile and roles.
     */
    async getMe(req, res, next) {
        try {
            const user = await authService_1.authService.getProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logs out the currently authenticated user session.
     */
    async logout(req, res, next) {
        try {
            if (req.user?.id) {
                await authService_1.authService.logout(req.user.id);
            }
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
