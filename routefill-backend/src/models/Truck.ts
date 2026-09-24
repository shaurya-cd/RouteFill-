import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum TruckStatusEnum {
  AVAILABLE = 'AVAILABLE',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_RISK = 'AT_RISK',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Truck Model.
 * Physical asset owned by a registered fleet owner with assigned type, capacity, and current status.
 */
export class Truck extends Model {
  declare id: number;
  declare owner_id: number;
  declare truck_number: string;
  declare truck_type_id: number;
  declare capacity_tons: number;
  declare status: TruckStatusEnum;
  declare current_location_id?: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare owner?: any;
  declare truckType?: any;
  declare currentLocation?: any;
  declare trips?: any;
}

Truck.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    truck_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    truck_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'truck_types',
        key: 'id',
      },
    },
    capacity_tons: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TruckStatusEnum)),
      defaultValue: TruckStatusEnum.AVAILABLE,
      allowNull: false,
    },
    current_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'trucks',
    indexes: [
      { fields: ['owner_id'] },
      { unique: true, fields: ['truck_number'] },
      { fields: ['status'] },
      { fields: ['truck_type_id'] },
    ],
  }
);
