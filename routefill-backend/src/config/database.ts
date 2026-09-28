import { Sequelize, Options } from 'sequelize';
import { ENV } from './env';

const dialectOptions: any = {};

if (ENV.DB_SSL && ENV.NODE_ENV === 'production') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: ENV.DB_SSL_REJECT_UNAUTHORIZED,
  };
}

const commonOptions: Options = {
  dialect: 'postgres',
  logging: ENV.DB_LOGGING ? console.log : false,
  dialectOptions,
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
};

/**
 * Initializes and configures the PostgreSQL connection pool using Sequelize ORM.
 */
export const sequelize = ENV.DATABASE_URL
  ? new Sequelize(ENV.DATABASE_URL, commonOptions)
  : new Sequelize(ENV.DB_NAME, ENV.DB_USER, ENV.DB_PASSWORD, {
      ...commonOptions,
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
    });

