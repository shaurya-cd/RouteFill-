import { z } from 'zod';
import { TruckStatusEnum } from '../models/Truck';

export const createTruckSchema = z.object({
  truck_number: z.string().min(4, 'Registration number must be at least 4 characters').toUpperCase(),
  truck_type_id: z.number().int().positive('Valid truck_type_id is required'),
  capacity_tons: z.number().positive('Capacity must be greater than 0'),
  current_location_id: z.number().int().positive().optional(),
});

export const updateTruckSchema = z.object({
  truck_number: z.string().min(4, 'Registration number must be at least 4 characters').toUpperCase().optional(),
  truck_type_id: z.number().int().positive('Valid truck_type_id is required').optional(),
  capacity_tons: z.number().positive('Capacity must be greater than 0').optional(),
  status: z.nativeEnum(TruckStatusEnum).optional(),
  current_location_id: z.number().int().positive().optional(),
});
