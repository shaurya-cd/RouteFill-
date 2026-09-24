import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Location Model.
 * Reusable spatial entity containing standardized geographic coordinates for routing calculations.
 * Avoids duplicate lat/long denormalization across trips and loads (3NF).
 */
export class Location extends Model {
  declare id: number;
  declare name: string;
  declare city: string;
  declare state: string;
  declare country: string;
  declare latitude: number;
  declare longitude: number;
}

Location.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(80),
      defaultValue: 'India',
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: false,
    indexes: [
      { fields: ['city'] },
      { fields: ['latitude', 'longitude'] },
    ],
  }
);
