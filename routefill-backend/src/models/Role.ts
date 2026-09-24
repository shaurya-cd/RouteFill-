import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  TRUCK_OWNER = 'TRUCK_OWNER',
  LOAD_POSTER = 'LOAD_POSTER',
}

/**
 * Role Model.
 * Normalized lookup table establishing discrete system roles to uphold 3NF.
 */
export class Role extends Model {
  declare id: number;
  declare name: UserRoleEnum;
  declare description: string;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
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
    tableName: 'roles',
    timestamps: false,
    indexes: [{ unique: true, fields: ['name'] }],
  }
);
