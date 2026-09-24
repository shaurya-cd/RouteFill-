"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationTypeEnum = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var NotificationTypeEnum;
(function (NotificationTypeEnum) {
    NotificationTypeEnum["LOAD_ACCEPTED"] = "LOAD_ACCEPTED";
    NotificationTypeEnum["ORDER_STATUS"] = "ORDER_STATUS";
    NotificationTypeEnum["CHAT_MESSAGE"] = "CHAT_MESSAGE";
    NotificationTypeEnum["SYSTEM"] = "SYSTEM";
})(NotificationTypeEnum || (exports.NotificationTypeEnum = NotificationTypeEnum = {}));
/**
 * Notification Model.
 * Represents operational alerts and dispatch updates for shippers, carriers, and admins.
 */
class Notification extends sequelize_1.Model {
}
exports.Notification = Notification;
Notification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(NotificationTypeEnum)),
        defaultValue: NotificationTypeEnum.SYSTEM,
        allowNull: false,
    },
    data: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    is_read: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'notifications',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] },
        { fields: ['created_at'] },
    ],
});
