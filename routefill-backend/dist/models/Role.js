"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.UserRoleEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var UserRoleEnum;
(function (UserRoleEnum) {
    UserRoleEnum["ADMIN"] = "ADMIN";
    UserRoleEnum["TRUCK_OWNER"] = "TRUCK_OWNER";
    UserRoleEnum["LOAD_POSTER"] = "LOAD_POSTER";
})(UserRoleEnum || (exports.UserRoleEnum = UserRoleEnum = {}));
/**
 * Role Model.
 * Normalized lookup table establishing discrete system roles to uphold 3NF.
 */
class Role extends sequelize_1.Model {
}
exports.Role = Role;
Role.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'roles',
    timestamps: false,
    indexes: [{ unique: true, fields: ['name'] }],
});
