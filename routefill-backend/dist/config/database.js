"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
/**
 * Initializes and configures the PostgreSQL connection pool using Sequelize ORM.
 */
exports.sequelize = new sequelize_1.Sequelize(env_1.ENV.DB_NAME, env_1.ENV.DB_USER, env_1.ENV.DB_PASSWORD, {
    host: env_1.ENV.DB_HOST,
    port: env_1.ENV.DB_PORT,
    dialect: 'postgres',
    logging: env_1.ENV.DB_LOGGING ? console.log : false,
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
});
