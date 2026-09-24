"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * Location Model.
 * Reusable spatial entity containing standardized geographic coordinates for routing calculations.
 * Avoids duplicate lat/long denormalization across trips and loads (3NF).
 */
class Location extends sequelize_1.Model {
}
exports.Location = Location;
Location.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    state: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    country: {
        type: sequelize_1.DataTypes.STRING(80),
        defaultValue: 'India',
        allowNull: false,
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 6),
        allowNull: false,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 6),
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'locations',
    timestamps: false,
    indexes: [
        { fields: ['city'] },
        { fields: ['latitude', 'longitude'] },
    ],
});
