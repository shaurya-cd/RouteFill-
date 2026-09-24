"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recommendation = exports.RecommendationStatusEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var RecommendationStatusEnum;
(function (RecommendationStatusEnum) {
    RecommendationStatusEnum["GENERATED"] = "GENERATED";
    RecommendationStatusEnum["VIEWED"] = "VIEWED";
    RecommendationStatusEnum["ACCEPTED"] = "ACCEPTED";
    RecommendationStatusEnum["REJECTED"] = "REJECTED";
    RecommendationStatusEnum["EXPIRED"] = "EXPIRED";
})(RecommendationStatusEnum || (exports.RecommendationStatusEnum = RecommendationStatusEnum = {}));
/**
 * Recommendation Model.
 * Persists AI-generated pairings between a vehicle at deadhead risk and an optimal return shipment.
 * Retains model_version to support comparative auditability and A/B tracking.
 */
class Recommendation extends sequelize_1.Model {
}
exports.Recommendation = Recommendation;
Recommendation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    truck_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'trucks',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    load_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'loads',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    dead_mileage_probability: {
        type: sequelize_1.DataTypes.DECIMAL(5, 4),
        allowNull: false,
    },
    acceptance_probability: {
        type: sequelize_1.DataTypes.DECIMAL(5, 4),
        allowNull: false,
    },
    success_probability: {
        type: sequelize_1.DataTypes.DECIMAL(5, 4),
        allowNull: false,
    },
    predicted_profit: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    final_recommendation_score: {
        type: sequelize_1.DataTypes.DECIMAL(6, 2),
        allowNull: false,
    },
    rank: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    model_version: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'v1.0',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(RecommendationStatusEnum)),
        defaultValue: RecommendationStatusEnum.GENERATED,
        allowNull: false,
    },
    generated_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'recommendations',
    timestamps: false,
    indexes: [
        { fields: ['truck_id'] },
        { fields: ['load_id'] },
        { fields: ['status'] },
        { fields: ['model_version'] },
    ],
});
