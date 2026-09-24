"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Load = exports.LoadStatusEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var LoadStatusEnum;
(function (LoadStatusEnum) {
    LoadStatusEnum["AVAILABLE"] = "AVAILABLE";
    LoadStatusEnum["RESERVED"] = "RESERVED";
    LoadStatusEnum["ASSIGNED"] = "ASSIGNED";
    LoadStatusEnum["IN_TRANSIT"] = "IN_TRANSIT";
    LoadStatusEnum["COMPLETED"] = "COMPLETED";
    LoadStatusEnum["CANCELLED"] = "CANCELLED";
    LoadStatusEnum["EXPIRED"] = "EXPIRED";
})(LoadStatusEnum || (exports.LoadStatusEnum = LoadStatusEnum = {}));
/**
 * Load Model.
 * Represents a freight shipment posted by shippers, brokers, or transporters.
 */
class Load extends sequelize_1.Model {
}
exports.Load = Load;
Load.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    poster_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    pickup_location_id: {
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
    truck_type_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'truck_types',
            key: 'id',
        },
    },
    weight_tons: {
        type: sequelize_1.DataTypes.DECIMAL(6, 2),
        allowNull: false,
    },
    cargo_description: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    offered_price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    pickup_start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    pickup_end_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(LoadStatusEnum)),
        defaultValue: LoadStatusEnum.AVAILABLE,
        allowNull: false,
    },
    assigned_truck_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'trucks',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'loads',
    indexes: [
        { fields: ['status'] },
        { fields: ['pickup_location_id'] },
        { fields: ['destination_location_id'] },
        { fields: ['truck_type_id'] },
        { fields: ['pickup_start_time'] },
    ],
});
