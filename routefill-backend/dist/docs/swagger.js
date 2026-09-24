"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RouteFill AI - Intelligent Logistics & Recommendation API',
            version: '1.0.0',
            description: 'Production backend API powering dead-mileage reduction, return-load recommendation, and continuous ML model training for commercial freight fleets.',
            contact: {
                name: 'RouteFill AI Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Provide JWT token in Authorization header: Bearer <token>',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
