"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationOutcome = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * RecommendationOutcome Model.
 * Captures real-world ground truth feedback following an AI recommendation.
 * Serves as the primary training data source for machine learning model retraining.
 */
class RecommendationOutcome extends sequelize_1.Model {
}
exports.RecommendationOutcome = RecommendationOutcome;
RecommendationOutcome.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    recommendation_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'recommendations',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    was_accepted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
    },
    was_completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    actual_profit: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    actual_fuel_cost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    actual_toll_cost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    actual_waiting_time_minutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    actual_distance_km: {
        type: sequelize_1.DataTypes.DECIMAL(8, 2),
        allowNull: true,
    },
    completion_delay_minutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    recorded_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'recommendation_outcomes',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['recommendation_id'] },
        { fields: ['was_accepted'] },
        { fields: ['was_completed'] },
    ],
});
