import { app } from './app';
import { ENV } from './config/env';
import { sequelize, setupAssociations } from './models';
import { autoSeedIfEmpty } from './seeders/seed';
import { logger } from './utils/logger';

/**
 * Bootstraps database associations, verifies connectivity, and binds the HTTP server.
 */
async function startServer() {
  try {
    logger.info('Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Initialize relational associations
    setupAssociations();

    // Sync database schema when enabled (safe alter in development)
    if (ENV.DB_SYNC) {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized with PostgreSQL schema.');
    } else {
      logger.info('Database schema auto-sync skipped (production mode).');
    }

    // Automatically seed necessary catalog data (Truck Types, Hub Locations, Roles) if empty
    await autoSeedIfEmpty();

    const server = app.listen(ENV.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`  RouteFill AI Backend listening on port: ${ENV.PORT}`);
      logger.info(`  Swagger API Documentation: http://localhost:${ENV.PORT}/api/docs`);
      logger.info(`  Python ML Microservice:    ${ENV.ML_SERVICE_URL}`);
      logger.info(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Closing HTTP server and database connections...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('All connections terminated. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Fatal error during server startup:', error.message);
    process.exit(1);
  }
}

startServer();
