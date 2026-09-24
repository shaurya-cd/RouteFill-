"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truckService = exports.TruckService = void 0;
const models_1 = require("../models");
const Truck_1 = require("../models/Truck");
const Trip_1 = require("../models/Trip");
const errors_1 = require("../utils/errors");
/**
 * Service managing truck fleet registration, owner scoping, and vehicle telemetry state.
 */
class TruckService {
    /**
     * Creates a truck belonging to the authenticated truck owner
     * and validates truck type, capacity, and registration number uniqueness.
     */
    async createTruck(ownerId, dto) {
        const existing = await models_1.Truck.findOne({ where: { truck_number: dto.truck_number } });
        if (existing) {
            throw new errors_1.ConflictError(`Truck with registration number ${dto.truck_number} is already registered`);
        }
        const typeExists = await models_1.TruckType.findByPk(dto.truck_type_id);
        if (!typeExists) {
            throw new errors_1.NotFoundError(`Truck type ID ${dto.truck_type_id} does not exist`);
        }
        if (dto.current_location_id) {
            const loc = await models_1.Location.findByPk(dto.current_location_id);
            if (!loc) {
                throw new errors_1.NotFoundError(`Location ID ${dto.current_location_id} does not exist`);
            }
        }
        const hasActiveTrip = !!(dto.origin_location_id && dto.destination_location_id);
        const truck = await models_1.Truck.create({
            owner_id: ownerId,
            truck_number: dto.truck_number,
            truck_type_id: dto.truck_type_id,
            capacity_tons: dto.capacity_tons,
            current_location_id: dto.destination_location_id || dto.current_location_id || null,
            status: hasActiveTrip ? Truck_1.TruckStatusEnum.IN_TRANSIT : Truck_1.TruckStatusEnum.AVAILABLE,
        });
        // If current trip details provided, schedule the active line-haul trip
        if (hasActiveTrip) {
            const arrival = dto.expected_arrival_time
                ? new Date(dto.expected_arrival_time)
                : new Date(Date.now() + 24 * 3600 * 1000);
            await models_1.Trip.create({
                truck_id: truck.id,
                origin_location_id: dto.origin_location_id,
                destination_location_id: dto.destination_location_id,
                scheduled_start_time: new Date(),
                actual_start_time: new Date(),
                estimated_completion_time: arrival,
                status: Trip_1.TripStatusEnum.IN_TRANSIT,
            });
        }
        return this.getTruckById(truck.id);
    }
    /**
     * Retrieves registered fleet trucks with populated associations and active trips.
     * If ownerId is specified, filters by that owner; otherwise retrieves all fleet trucks.
     */
    async getTrucks(ownerId, status) {
        const where = {};
        if (ownerId) {
            where.owner_id = ownerId;
        }
        if (status) {
            where.status = status;
        }
        return models_1.Truck.findAll({
            where,
            include: [
                { model: models_1.TruckType, as: 'truckType', attributes: ['id', 'name', 'description'] },
                { model: models_1.Location, as: 'currentLocation', attributes: ['id', 'name', 'city', 'state', 'latitude', 'longitude'] },
                { model: models_1.User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
                {
                    model: models_1.Trip,
                    as: 'trips',
                    required: false,
                    include: [
                        { model: models_1.Location, as: 'originLocation', attributes: ['id', 'name', 'city', 'state'] },
                        { model: models_1.Location, as: 'destinationLocation', attributes: ['id', 'name', 'city', 'state'] },
                    ],
                },
            ],
            order: [
                ['id', 'DESC'],
                [{ model: models_1.Trip, as: 'trips' }, 'id', 'DESC'],
            ],
        });
    }
    /**
     * Retrieves only trucks belonging to the authenticated owner.
     */
    async getOwnerTrucks(ownerId) {
        return this.getTrucks(ownerId);
    }
    /**
     * Retrieves a single truck record with populated associations and active trip.
     */
    async getTruckById(id, ownerId) {
        const truck = await models_1.Truck.findByPk(id, {
            include: [
                { model: models_1.TruckType, as: 'truckType', attributes: ['id', 'name', 'description'] },
                { model: models_1.Location, as: 'currentLocation', attributes: ['id', 'name', 'city', 'state', 'latitude', 'longitude'] },
                { model: models_1.User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
                {
                    model: models_1.Trip,
                    as: 'trips',
                    required: false,
                    include: [
                        { model: models_1.Location, as: 'originLocation', attributes: ['id', 'name', 'city', 'state'] },
                        { model: models_1.Location, as: 'destinationLocation', attributes: ['id', 'name', 'city', 'state'] },
                    ],
                },
            ],
            order: [[{ model: models_1.Trip, as: 'trips' }, 'id', 'DESC']],
        });
        if (!truck) {
            throw new errors_1.NotFoundError(`Truck with ID ${id} not found`);
        }
        if (ownerId && truck.owner_id !== ownerId) {
            throw new errors_1.ForbiddenError('Unauthorized: You do not own this vehicle');
        }
        return truck;
    }
    /**
     * Modifies truck operational status or capacity after confirming owner permissions.
     */
    async updateTruck(id, ownerId, dto) {
        const truck = await this.getTruckById(id, ownerId);
        await truck.update(dto);
        return this.getTruckById(id);
    }
    /**
     * Removes a vehicle record from the owner's active fleet.
     */
    async deleteTruck(id, ownerId) {
        const truck = await this.getTruckById(id, ownerId);
        await truck.destroy();
        return { success: true, message: `Truck ${truck.truck_number} deleted successfully` };
    }
}
exports.TruckService = TruckService;
exports.truckService = new TruckService();
