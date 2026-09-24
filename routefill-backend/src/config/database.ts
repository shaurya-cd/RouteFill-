import { Sequelize } from 'sequelize';
import { ENV } from './env';

/**
 * Initializes and configures the PostgreSQL connection pool using Sequelize ORM.
 */
export const sequelize = new Sequelize(
  ENV.DB_NAME,
  ENV.DB_USER,
  ENV.DB_PASSWORD,
  {
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    dialect: 'postgres',
    logging: ENV.DB_LOGGING ? console.log : false,
    pool: {
      max: 15,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true
    }
  }
);
