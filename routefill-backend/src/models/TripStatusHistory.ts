import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * TripStatusHistory Model.
 * Immutable audit trail capturing timestamped operational status transitions for fleet trips.
 */
export class TripStatusHistory extends Model {
  declare id: number;
  declare trip_id: number;
  declare previous_status: string;
  declare new_status: string;
  declare notes?: string;
  declare changed_at: Date;

  declare trip?: any;
}

TripStatusHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    previous_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'trip_status_history',
    timestamps: false,
    indexes: [
      { fields: ['trip_id'] },
      { fields: ['changed_at'] },
    ],
  }
);
