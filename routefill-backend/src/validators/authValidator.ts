import { z } from 'zod';
import { UserRoleEnum } from '../models/Role';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase().max(255),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 characters').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z
    .enum([UserRoleEnum.TRUCK_OWNER, UserRoleEnum.LOAD_POSTER], {
      errorMap: () => ({ message: 'Public registration allows TRUCK_OWNER or LOAD_POSTER roles only' }),
    })
    .default(UserRoleEnum.TRUCK_OWNER),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

