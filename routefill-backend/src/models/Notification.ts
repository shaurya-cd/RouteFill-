import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum NotificationTypeEnum {
  LOAD_ACCEPTED = 'LOAD_ACCEPTED',
  ORDER_STATUS = 'ORDER_STATUS',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  SYSTEM = 'SYSTEM',
}

/**
 * Notification Model.
 * Represents operational alerts and dispatch updates for shippers, carriers, and admins.
 */
export class Notification extends Model {
  declare id: number;
  declare user_id: number;
  declare title: string;
  declare message: string;
  declare type: NotificationTypeEnum;
  declare data?: any;
  declare is_read: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare user?: any;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationTypeEnum)),
      defaultValue: NotificationTypeEnum.SYSTEM,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);
