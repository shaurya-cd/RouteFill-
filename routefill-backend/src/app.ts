import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import apiRouter from './routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middleware/errorMiddleware';
import { mlClient } from './clients/mlClient';

/**
 * Creates and configures the Express application pipeline with security, documentation, and routing.
 */
export function createApp(): Application {
  const app: Application = express();

  // Security headers & CORS
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));

  // Request parsing & telemetry
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Interactive Swagger UI & OpenAPI spec
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health and readiness check
  app.get('/health', async (req: Request, res: Response) => {
    const mlHealth = await mlClient.checkHealth();
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'RouteFill AI - Backend API',
      ml_service: mlHealth,
    });
  });

  // Mount API resource routes
  app.use('/api', apiRouter);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
