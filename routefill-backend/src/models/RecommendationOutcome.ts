import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * RecommendationOutcome Model.
 * Captures real-world ground truth feedback following an AI recommendation.
 * Serves as the primary training data source for machine learning model retraining.
 */
export class RecommendationOutcome extends Model {
  declare id: number;
  declare recommendation_id: number;
  declare was_accepted: boolean;
  declare was_completed: boolean;
  declare actual_profit?: number;
  declare actual_fuel_cost?: number;
  declare actual_toll_cost?: number;
  declare actual_waiting_time_minutes?: number;
  declare actual_distance_km?: number;
  declare completion_delay_minutes?: number;
  declare recorded_at: Date;

  declare recommendation?: any;
}

RecommendationOutcome.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recommendation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'recommendations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    was_accepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    was_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    actual_profit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    actual_fuel_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    actual_toll_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    actual_waiting_time_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actual_distance_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    completion_delay_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'recommendation_outcomes',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['recommendation_id'] },
      { fields: ['was_accepted'] },
      { fields: ['was_completed'] },
    ],
  }
);
