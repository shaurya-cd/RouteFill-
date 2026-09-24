import { z } from 'zod';
import { TripStatusEnum } from '../models/Trip';

export const createTripSchema = z.object({
  truck_id: z.number().int().positive('Valid truck ID required'),
  origin_location_id: z.number().int().positive('Origin location required'),
  destination_location_id: z.number().int().positive('Destination location required'),
  scheduled_start_time: z.string().datetime().or(z.string().min(10)),
  estimated_completion_time: z.string().datetime().or(z.string().min(10)),
});

export const updateTripSchema = z.object({
  status: z.nativeEnum(TripStatusEnum).optional(),
  actual_start_time: z.string().datetime().or(z.string().min(10)).optional(),
  actual_completion_time: z.string().datetime().or(z.string().min(10)).optional(),
});
