"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTruckSchema = exports.createTruckSchema = void 0;
const zod_1 = require("zod");
const Truck_1 = require("../models/Truck");
exports.createTruckSchema = zod_1.z.object({
    truck_number: zod_1.z.string().min(4, 'Registration number must be at least 4 characters').toUpperCase(),
    truck_type_id: zod_1.z.number().int().positive('Valid truck_type_id is required'),
    capacity_tons: zod_1.z.number().positive('Capacity must be greater than 0'),
    current_location_id: zod_1.z.number().int().positive().optional(),
});
exports.updateTruckSchema = zod_1.z.object({
    truck_number: zod_1.z.string().min(4, 'Registration number must be at least 4 characters').toUpperCase().optional(),
    truck_type_id: zod_1.z.number().int().positive('Valid truck_type_id is required').optional(),
    capacity_tons: zod_1.z.number().positive('Capacity must be greater than 0').optional(),
    status: zod_1.z.nativeEnum(Truck_1.TruckStatusEnum).optional(),
    current_location_id: zod_1.z.number().int().positive().optional(),
});
