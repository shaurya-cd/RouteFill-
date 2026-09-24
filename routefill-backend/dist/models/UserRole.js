"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * UserRole Junction Model.
 * Represents many-to-many associations between Users and Roles, fully supporting multi-role actors.
 */
class UserRole extends sequelize_1.Model {
}
exports.UserRole = UserRole;
UserRole.init({
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    role_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'roles',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'user_roles',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['role_id'] },
    ],
});
