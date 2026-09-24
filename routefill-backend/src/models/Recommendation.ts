import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum RecommendationStatusEnum {
  GENERATED = 'GENERATED',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Recommendation Model.
 * Persists AI-generated pairings between a vehicle at deadhead risk and an optimal return shipment.
 * Retains model_version to support comparative auditability and A/B tracking.
 */
export class Recommendation extends Model {
  declare id: number;
  declare truck_id: number;
  declare load_id: number;
  declare dead_mileage_probability: number;
  declare acceptance_probability: number;
  declare success_probability: number;
  declare predicted_profit: number;
  declare final_recommendation_score: number;
  declare rank: number;
  declare model_version: string;
  declare status: RecommendationStatusEnum;
  declare generated_at: Date;

  declare truck?: any;
  declare load?: any;
  declare outcome?: any;
}

Recommendation.init(
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
    load_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loads',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    dead_mileage_probability: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    acceptance_probability: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    success_probability: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    predicted_profit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    final_recommendation_score: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    model_version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'v1.0',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RecommendationStatusEnum)),
      defaultValue: RecommendationStatusEnum.GENERATED,
      allowNull: false,
    },
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'recommendations',
    timestamps: false,
    indexes: [
      { fields: ['truck_id'] },
      { fields: ['load_id'] },
      { fields: ['status'] },
      { fields: ['model_version'] },
    ],
  }
);
