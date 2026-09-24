"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trip = exports.TripStatusEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var TripStatusEnum;
(function (TripStatusEnum) {
    TripStatusEnum["SCHEDULED"] = "SCHEDULED";
    TripStatusEnum["IN_TRANSIT"] = "IN_TRANSIT";
    TripStatusEnum["COMPLETED"] = "COMPLETED";
    TripStatusEnum["CANCELLED"] = "CANCELLED";
})(TripStatusEnum || (exports.TripStatusEnum = TripStatusEnum = {}));
/**
 * Trip Model.
 * Represents physical line-haul journeys undertaken by a vehicle.
 * Historical trip records remain immutable to ensure data integrity for ML model training.
 */
class Trip extends sequelize_1.Model {
}
exports.Trip = Trip;
Trip.init({
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
    origin_location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
            key: 'id',
        },
    },
    destination_location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
            key: 'id',
        },
    },
    scheduled_start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    actual_start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    estimated_completion_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    actual_completion_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(TripStatusEnum)),
        defaultValue: TripStatusEnum.SCHEDULED,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'trips',
    indexes: [
        { fields: ['truck_id'] },
        { fields: ['status'] },
        { fields: ['destination_location_id'] },
        { fields: ['estimated_completion_time'] },
    ],
});
