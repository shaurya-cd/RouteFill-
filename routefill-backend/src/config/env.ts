import dotenv from 'dotenv';
dotenv.config();

/**
 * Validated environment configurations.
 */
export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'routefill_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',
  DB_LOGGING: process.env.DB_LOGGING === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'routefill_default_jwt_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  ML_SERVICE_TIMEOUT: parseInt(process.env.ML_SERVICE_TIMEOUT || '10000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
