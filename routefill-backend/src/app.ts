import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import { sequelize } from './models';
import apiRouter from './routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middleware/errorMiddleware';
import { globalRateLimiter } from './middleware/rateLimitMiddleware';
import { mlClient } from './clients/mlClient';

/**
 * Creates and configures the Express application pipeline with security, documentation, and routing.
 */
export function createApp(): Application {
  const app: Application = express();

  // Security headers & CORS
  app.use(helmet({ contentSecurityPolicy: false }));

  const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((o) => o.trim());
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Request parsing & telemetry
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Interactive Swagger UI & OpenAPI spec
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Comprehensive health and readiness check for cloud orchestrators
  app.get('/health', async (req: Request, res: Response) => {
    let dbStatus = 'UP';
    let dbError: string | undefined = undefined;
    try {
      await sequelize.authenticate();
    } catch (err: any) {
      dbStatus = 'DOWN';
      dbError = err?.message;
    }

    const mlHealth = await mlClient.checkHealth();
    const isHealthy = dbStatus === 'UP';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      service: 'RouteFill AI - Backend API',
      database: { status: dbStatus, ...(dbError && ENV.NODE_ENV !== 'production' ? { error: dbError } : {}) },
      ml_service: mlHealth,
    });
  });

  // Apply DoS rate limiter to all API endpoints
  app.use('/api', globalRateLimiter);

  // Mount API resource routes
  app.use('/api', apiRouter);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

