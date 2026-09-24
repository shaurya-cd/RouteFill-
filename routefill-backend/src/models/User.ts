import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

/**
 * User Model.
 * Represents system actors including fleet owners, load posters, and administrators.
 * Normalized to 3NF by decoupling access permissions into a distinct Role entity.
 */
export class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare password_hash: string;
  declare is_active: boolean;
  declare last_login_at?: Date | null;
  declare last_logout_at?: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare roles?: any[];

  /**
   * Compares a plain text password against the hashed password.
   */
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Serializes the user model while stripping sensitive credential fields.
   */
  public toSafeJSON(): Record<string, any> {
    const raw = this.toJSON() as any;
    delete raw.password_hash;
    return raw;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_logout_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['is_active'] },
    ],
  }
);

