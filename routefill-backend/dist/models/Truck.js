"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Truck = exports.TruckStatusEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var TruckStatusEnum;
(function (TruckStatusEnum) {
    TruckStatusEnum["AVAILABLE"] = "AVAILABLE";
    TruckStatusEnum["IN_TRANSIT"] = "IN_TRANSIT";
    TruckStatusEnum["AT_RISK"] = "AT_RISK";
    TruckStatusEnum["MAINTENANCE"] = "MAINTENANCE";
})(TruckStatusEnum || (exports.TruckStatusEnum = TruckStatusEnum = {}));
/**
 * Truck Model.
 * Physical asset owned by a registered fleet owner with assigned type, capacity, and current status.
 */
class Truck extends sequelize_1.Model {
}
exports.Truck = Truck;
Truck.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    owner_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    truck_number: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
        unique: true,
    },
    truck_type_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'truck_types',
            key: 'id',
        },
    },
    capacity_tons: {
        type: sequelize_1.DataTypes.DECIMAL(6, 2),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(TruckStatusEnum)),
        defaultValue: TruckStatusEnum.AVAILABLE,
        allowNull: false,
    },
    current_location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'locations',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'trucks',
    indexes: [
        { fields: ['owner_id'] },
        { unique: true, fields: ['truck_number'] },
        { fields: ['status'] },
        { fields: ['truck_type_id'] },
    ],
});
