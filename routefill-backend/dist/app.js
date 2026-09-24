"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const swagger_1 = require("./docs/swagger");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const mlClient_1 = require("./clients/mlClient");
/**
 * Creates and configures the Express application pipeline with security, documentation, and routing.
 */
function createApp() {
    const app = (0, express_1.default)();
    // Security headers & CORS
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
    // Request parsing & telemetry
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    if (env_1.ENV.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Interactive Swagger UI & OpenAPI spec
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swagger_1.swaggerSpec);
    });
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    // Health and readiness check
    app.get('/health', async (req, res) => {
        const mlHealth = await mlClient_1.mlClient.checkHealth();
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'RouteFill AI - Backend API',
            ml_service: mlHealth,
        });
    });
    // Mount API resource routes
    app.use('/api', routes_1.default);
    // Global centralized error handler
    app.use(errorMiddleware_1.errorHandler);
    return app;
}
exports.app = createApp();
