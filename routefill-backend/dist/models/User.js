"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
/**
 * User Model.
 * Represents system actors including fleet owners, load posters, and administrators.
 * Normalized to 3NF by decoupling access permissions into a distinct Role entity.
 */
class User extends sequelize_1.Model {
    /**
     * Compares a plain text password against the hashed password.
     */
    async validatePassword(password) {
        return bcryptjs_1.default.compare(password, this.password_hash);
    }
    /**
     * Serializes the user model while stripping sensitive credential fields.
     */
    toSafeJSON() {
        const raw = this.toJSON();
        delete raw.password_hash;
        return raw;
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    password_hash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    last_login_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    last_logout_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['is_active'] },
    ],
});
