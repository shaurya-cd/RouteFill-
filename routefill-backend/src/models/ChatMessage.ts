import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * ChatMessage Model.
 * Represents direct messages exchanged between shippers and carriers regarding specific freight shipments/orders.
 */
export class ChatMessage extends Model {
  declare id: number;
  declare load_id: number;
  declare sender_id: number;
  declare receiver_id: number;
  declare message: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare sender?: any;
  declare receiver?: any;
  declare load?: any;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    load_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loads',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'chat_messages',
    indexes: [
      { fields: ['load_id'] },
      { fields: ['sender_id'] },
      { fields: ['receiver_id'] },
      { fields: ['created_at'] },
    ],
  }
);
