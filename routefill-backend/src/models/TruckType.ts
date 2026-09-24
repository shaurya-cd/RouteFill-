import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum TruckTypeEnum {
  OPEN_TRUCK = 'OPEN_TRUCK',
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  REFRIGERATED = 'REFRIGERATED',
}

/**
 * TruckType Model.
 * Normalized catalog specifying vehicle body types to eliminate repetitive string attributes (3NF).
 */
export class TruckType extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
}

TruckType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'truck_types',
    timestamps: false,
    indexes: [{ unique: true, fields: ['name'] }],
  }
);
