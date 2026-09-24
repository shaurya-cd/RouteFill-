"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const models_1 = require("./models");
const logger_1 = require("./utils/logger");
/**
 * Bootstraps database associations, verifies connectivity, and binds the HTTP server.
 */
async function startServer() {
    try {
        logger_1.logger.info('Connecting to PostgreSQL database...');
        await models_1.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        // Initialize relational associations
        (0, models_1.setupAssociations)();
        // Sync database schema (safe alter)
        await models_1.sequelize.sync({ alter: true });
        logger_1.logger.info('Database models synchronized with PostgreSQL schema.');
        const server = app_1.app.listen(env_1.ENV.PORT, () => {
            logger_1.logger.info(`=======================================================`);
            logger_1.logger.info(`  RouteFill AI Backend listening on port: ${env_1.ENV.PORT}`);
            logger_1.logger.info(`  Swagger API Documentation: http://localhost:${env_1.ENV.PORT}/api/docs`);
            logger_1.logger.info(`  Python ML Microservice:    ${env_1.ENV.ML_SERVICE_URL}`);
            logger_1.logger.info(`=======================================================`);
        });
        const shutdown = async (signal) => {
            logger_1.logger.info(`${signal} received. Closing HTTP server and database connections...`);
            server.close(async () => {
                await models_1.sequelize.close();
                logger_1.logger.info('All connections terminated. Process exiting.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Fatal error during server startup:', error.message);
        process.exit(1);
    }
}
startServer();
