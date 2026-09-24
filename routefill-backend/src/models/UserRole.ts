import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * UserRole Junction Model.
 * Represents many-to-many associations between Users and Roles, fully supporting multi-role actors.
 */
export class UserRole extends Model {
  declare user_id: number;
  declare role_id: number;
}

UserRole.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'user_roles',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['role_id'] },
    ],
  }
);
