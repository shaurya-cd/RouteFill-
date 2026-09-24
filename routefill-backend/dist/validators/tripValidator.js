"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTripSchema = exports.createTripSchema = void 0;
const zod_1 = require("zod");
const Trip_1 = require("../models/Trip");
exports.createTripSchema = zod_1.z.object({
    truck_id: zod_1.z.number().int().positive('Valid truck ID required'),
    origin_location_id: zod_1.z.number().int().positive('Origin location required'),
    destination_location_id: zod_1.z.number().int().positive('Destination location required'),
    scheduled_start_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)),
    estimated_completion_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)),
});
exports.updateTripSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(Trip_1.TripStatusEnum).optional(),
    actual_start_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)).optional(),
    actual_completion_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)).optional(),
});
