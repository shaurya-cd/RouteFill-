"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripStatusHistory = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * TripStatusHistory Model.
 * Immutable audit trail capturing timestamped operational status transitions for fleet trips.
 */
class TripStatusHistory extends sequelize_1.Model {
}
exports.TripStatusHistory = TripStatusHistory;
TripStatusHistory.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    trip_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'trips',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    previous_status: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    new_status: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    notes: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    changed_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'trip_status_history',
    timestamps: false,
    indexes: [
        { fields: ['trip_id'] },
        { fields: ['changed_at'] },
    ],
});
