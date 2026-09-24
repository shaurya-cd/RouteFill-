import { z } from 'zod';

export const recordOutcomeSchema = z.object({
  was_accepted: z.boolean(),
  was_completed: z.boolean().default(false),
  actual_profit: z.number().optional(),
  actual_fuel_cost: z.number().optional(),
  actual_toll_cost: z.number().optional(),
  actual_waiting_time_minutes: z.number().int().nonnegative().optional(),
  actual_distance_km: z.number().positive().optional(),
  completion_delay_minutes: z.number().int().optional(),
});
