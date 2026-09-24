import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum LoadStatusEnum {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * Load Model.
 * Represents a freight shipment posted by shippers, brokers, or transporters.
 */
export class Load extends Model {
  declare id: number;
  declare poster_id: number;
  declare pickup_location_id: number;
  declare destination_location_id: number;
  declare truck_type_id: number;
  declare weight_tons: number;
  declare cargo_description: string;
  declare offered_price: number;
  declare pickup_start_time: Date;
  declare pickup_end_time: Date;
  declare status: LoadStatusEnum;
  declare assigned_truck_id?: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare poster?: any;
  declare pickupLocation?: any;
  declare destinationLocation?: any;
  declare truckType?: any;
}

Load.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    poster_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    pickup_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    destination_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    truck_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'truck_types',
        key: 'id',
      },
    },
    weight_tons: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    cargo_description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    offered_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    pickup_start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pickup_end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LoadStatusEnum)),
      defaultValue: LoadStatusEnum.AVAILABLE,
      allowNull: false,
    },
    assigned_truck_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'trucks',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'loads',
    indexes: [
      { fields: ['status'] },
      { fields: ['pickup_location_id'] },
      { fields: ['destination_location_id'] },
      { fields: ['truck_type_id'] },
      { fields: ['pickup_start_time'] },
    ],
  }
);
