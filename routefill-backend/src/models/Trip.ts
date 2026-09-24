import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum TripStatusEnum {
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Trip Model.
 * Represents physical line-haul journeys undertaken by a vehicle.
 * Historical trip records remain immutable to ensure data integrity for ML model training.
 */
export class Trip extends Model {
  declare id: number;
  declare truck_id: number;
  declare origin_location_id: number;
  declare destination_location_id: number;
  declare scheduled_start_time: Date;
  declare actual_start_time?: Date;
  declare estimated_completion_time: Date;
  declare actual_completion_time?: Date;
  declare status: TripStatusEnum;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare truck?: any;
  declare originLocation?: any;
  declare destinationLocation?: any;
}

Trip.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    truck_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trucks',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    origin_location_id: {
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
    scheduled_start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actual_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimated_completion_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actual_completion_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TripStatusEnum)),
      defaultValue: TripStatusEnum.SCHEDULED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'trips',
    indexes: [
      { fields: ['truck_id'] },
      { fields: ['status'] },
      { fields: ['destination_location_id'] },
      { fields: ['estimated_completion_time'] },
    ],
  }
);
