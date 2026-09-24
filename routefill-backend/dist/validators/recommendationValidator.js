"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordOutcomeSchema = void 0;
const zod_1 = require("zod");
exports.recordOutcomeSchema = zod_1.z.object({
    was_accepted: zod_1.z.boolean(),
    was_completed: zod_1.z.boolean().default(false),
    actual_profit: zod_1.z.number().optional(),
    actual_fuel_cost: zod_1.z.number().optional(),
    actual_toll_cost: zod_1.z.number().optional(),
    actual_waiting_time_minutes: zod_1.z.number().int().nonnegative().optional(),
    actual_distance_km: zod_1.z.number().positive().optional(),
    completion_delay_minutes: zod_1.z.number().int().optional(),
});
