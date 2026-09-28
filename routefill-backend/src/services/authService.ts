import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, Role, UserRole } from '../models';
import { UserRoleEnum } from '../models/Role';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';

export interface RegisterDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRoleEnum;
}

/**
 * Handles identity lifecycle, credential verification, and JSON Web Token issuance.
 */
export class AuthService {
  /**
   * Registers a new platform user, hashes password via bcrypt, and assigns specified system role.
   */
  public async register(dto: RegisterDTO) {
    const existing = await User.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Prevent privilege escalation to ADMIN
    const requestedRole = dto.role || UserRoleEnum.TRUCK_OWNER;
    if (requestedRole === UserRoleEnum.ADMIN) {
      throw new BadRequestError('Admin accounts cannot be created via public registration');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await User.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password_hash: passwordHash,
      is_active: true,
    });

    // Assign role
    const targetRoleName = requestedRole;
    let role = await Role.findOne({ where: { name: targetRoleName } });
    if (!role) {
      role = await Role.create({
        name: targetRoleName,
        description: `Default role for ${targetRoleName}`,
      });
    }

    await UserRole.create({
      user_id: user.id,
      role_id: role.id,
    });

    const token = this.generateToken(user.id, user.email, [targetRoleName]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: [targetRoleName],
      },
      token,
    };
  }

  /**
   * Validates user credentials against bcrypt hashes and generates an authenticated JWT session token.
   */
  public async login(email: string, password: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Record login timestamp
    user.last_login_at = new Date();
    await user.save();

    const roles = (user.roles || []).map((r: any) => r.name);
    const token = this.generateToken(user.id, user.email, roles);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles,
        last_login_at: user.last_login_at,
        last_logout_at: user.last_logout_at,
      },
      token,
    };
  }

  /**
   * Records user session termination and saves logout timestamp.
   */
  public async logout(userId: number) {
    const user = await User.findByPk(userId);
    if (user) {
      user.last_logout_at = new Date();
      await user.save();
    }
    return { success: true, message: 'User session logged out successfully' };
  }

  /**
   * Retrieves profile details and assigned authorizations for an authenticated user ID.
   */
  public async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Role, as: 'roles', attributes: ['name', 'description'] }],
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  /**
   * Helper constructing signed JWT tokens embedding user claims and expiration window.
   */
  private generateToken(userId: number, email: string, roles: string[]): string {
    return jwt.sign(
      { userId, email, roles },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );
  }
}

export const authService = new AuthService();
