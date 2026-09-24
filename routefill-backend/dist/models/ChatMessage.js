"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
/**
 * ChatMessage Model.
 * Represents direct messages exchanged between shippers and carriers regarding specific freight shipments/orders.
 */
class ChatMessage extends sequelize_1.Model {
}
exports.ChatMessage = ChatMessage;
ChatMessage.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
    sender_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    receiver_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'chat_messages',
    indexes: [
        { fields: ['load_id'] },
        { fields: ['sender_id'] },
        { fields: ['receiver_id'] },
        { fields: ['created_at'] },
    ],
});
