"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearbyLoadsQuerySchema = exports.updateLoadSchema = exports.createLoadSchema = void 0;
const zod_1 = require("zod");
const Load_1 = require("../models/Load");
exports.createLoadSchema = zod_1.z.object({
    pickup_location_id: zod_1.z.number().int().positive('Valid pickup location required'),
    destination_location_id: zod_1.z.number().int().positive('Valid destination location required'),
    truck_type_id: zod_1.z.number().int().positive('Valid truck type required'),
    weight_tons: zod_1.z.number().positive('Weight must be greater than 0'),
    cargo_description: zod_1.z.string().min(2, 'Cargo description is required'),
    offered_price: zod_1.z.number().positive('Offered price must be positive'),
    pickup_start_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)),
    pickup_end_time: zod_1.z.string().datetime().or(zod_1.z.string().min(10)),
});
exports.updateLoadSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(Load_1.LoadStatusEnum).optional(),
    offered_price: zod_1.z.number().positive().optional(),
    assigned_truck_id: zod_1.z.number().int().positive().nullable().optional(),
});
exports.nearbyLoadsQuerySchema = zod_1.z.object({
    latitude: zod_1.z.string().transform((v) => parseFloat(v)),
    longitude: zod_1.z.string().transform((v) => parseFloat(v)),
    radius: zod_1.z.string().optional().default('150').transform((v) => parseFloat(v)),
});
