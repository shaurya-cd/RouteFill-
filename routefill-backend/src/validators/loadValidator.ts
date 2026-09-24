import { z } from 'zod';
import { LoadStatusEnum } from '../models/Load';

export const createLoadSchema = z.object({
  pickup_location_id: z.number().int().positive('Valid pickup location required'),
  destination_location_id: z.number().int().positive('Valid destination location required'),
  truck_type_id: z.number().int().positive('Valid truck type required'),
  weight_tons: z.number().positive('Weight must be greater than 0'),
  cargo_description: z.string().min(2, 'Cargo description is required'),
  offered_price: z.number().positive('Offered price must be positive'),
  pickup_start_time: z.string().datetime().or(z.string().min(10)),
  pickup_end_time: z.string().datetime().or(z.string().min(10)),
});

export const updateLoadSchema = z.object({
  status: z.nativeEnum(LoadStatusEnum).optional(),
  offered_price: z.number().positive().optional(),
  assigned_truck_id: z.number().int().positive().nullable().optional(),
});

export const nearbyLoadsQuerySchema = z.object({
  latitude: z.string().transform((v) => parseFloat(v)),
  longitude: z.string().transform((v) => parseFloat(v)),
  radius: z.string().optional().default('150').transform((v) => parseFloat(v)),
});
