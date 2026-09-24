"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruckType = exports.TruckTypeEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var TruckTypeEnum;
(function (TruckTypeEnum) {
    TruckTypeEnum["OPEN_TRUCK"] = "OPEN_TRUCK";
    TruckTypeEnum["CONTAINER"] = "CONTAINER";
    TruckTypeEnum["TANKER"] = "TANKER";
    TruckTypeEnum["REFRIGERATED"] = "REFRIGERATED";
})(TruckTypeEnum || (exports.TruckTypeEnum = TruckTypeEnum = {}));
/**
 * TruckType Model.
 * Normalized catalog specifying vehicle body types to eliminate repetitive string attributes (3NF).
 */
class TruckType extends sequelize_1.Model {
}
exports.TruckType = TruckType;
TruckType.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(60),
        allowNull: false,
        unique: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'truck_types',
    timestamps: false,
    indexes: [{ unique: true, fields: ['name'] }],
});
