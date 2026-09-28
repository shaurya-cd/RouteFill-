import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, enforce strong, explicitly configured JWT secrets
const defaultInsecureSecrets = [
  'routefill_default_jwt_secret_key',
  'your_jwt_secret_key',
  'secret',
  'password',
  'routefill_super_secret_jwt_key_2026_secure_fleet_engine'
];

const rawJwtSecret = process.env.JWT_SECRET || 'routefill_default_jwt_secret_key';

if (isProduction) {
  if (!process.env.JWT_SECRET || defaultInsecureSecrets.includes(rawJwtSecret) || rawJwtSecret.length < 32) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: In production (NODE_ENV=production), JWT_SECRET must be explicitly set to a strong secret of at least 32 characters.'
    );
  }
}

let rawMlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
if (rawMlUrl && !rawMlUrl.startsWith('http://') && !rawMlUrl.startsWith('https://')) {
  rawMlUrl = `http://${rawMlUrl}`;
}

/**
 * Validated and hardened environment configurations.
 */
export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'routefill_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',
  DB_LOGGING: process.env.DB_LOGGING === 'true',
  DB_SSL: process.env.DB_SSL === 'true' || (isProduction && Boolean(process.env.DATABASE_URL)),
  DB_SSL_REJECT_UNAUTHORIZED: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  DB_SYNC: process.env.DB_SYNC ? process.env.DB_SYNC === 'true' : !isProduction,
  JWT_SECRET: rawJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ML_SERVICE_URL: rawMlUrl,
  ML_SERVICE_TIMEOUT: parseInt(process.env.ML_SERVICE_TIMEOUT || '10000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
};

