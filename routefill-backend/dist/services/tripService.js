"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripService = exports.TripService = void 0;
const models_1 = require("../models");
const Trip_1 = require("../models/Trip");
const Truck_1 = require("../models/Truck");
const mlClient_1 = require("../clients/mlClient");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Service managing line-haul trips, execution lifecycles, and deadhead risk analysis triggers.
 */
class TripService {
    /**
     * Schedules a new line-haul trip for a truck and marks the vehicle IN_TRANSIT.
     */
    async createTrip(dto) {
        const truck = await models_1.Truck.findByPk(dto.truck_id);
        if (!truck) {
            throw new errors_1.NotFoundError(`Truck ID ${dto.truck_id} not found`);
        }
        const trip = await models_1.Trip.create({
            truck_id: dto.truck_id,
            origin_location_id: dto.origin_location_id,
            destination_location_id: dto.destination_location_id,
            scheduled_start_time: new Date(dto.scheduled_start_time),
            estimated_completion_time: new Date(dto.estimated_completion_time),
            status: Trip_1.TripStatusEnum.SCHEDULED,
        });
        await truck.update({
            status: Truck_1.TruckStatusEnum.IN_TRANSIT,
            current_location_id: dto.origin_location_id,
        });
        await models_1.TripStatusHistory.create({
            trip_id: trip.id,
            previous_status: 'NONE',
            new_status: Trip_1.TripStatusEnum.SCHEDULED,
            notes: 'Initial trip creation',
        });
        return this.getTripById(trip.id);
    }
    /**
     * Retrieves line-haul trips with associated origins, destinations, and assigned vehicles.
     */
    async getTrips(truckId) {
        const where = {};
        if (truckId)
            where.truck_id = truckId;
        return models_1.Trip.findAll({
            where,
            include: [
                { model: models_1.Truck, as: 'truck' },
                { model: models_1.Location, as: 'originLocation' },
                { model: models_1.Location, as: 'destinationLocation' },
                { model: models_1.TripStatusHistory, as: 'statusHistory' },
            ],
            order: [['id', 'DESC']],
        });
    }
    /**
     * Retrieves single trip record with full associations.
     */
    async getTripById(id) {
        const trip = await models_1.Trip.findByPk(id, {
            include: [
                { model: models_1.Truck, as: 'truck' },
                { model: models_1.Location, as: 'originLocation' },
                { model: models_1.Location, as: 'destinationLocation' },
                { model: models_1.TripStatusHistory, as: 'statusHistory' },
            ],
        });
        if (!trip) {
            throw new errors_1.NotFoundError(`Trip with ID ${id} not found`);
        }
        return trip;
    }
    /**
     * Updates trip status and triggers dead-mileage detection upon trip completion.
     */
    async updateTrip(id, dto) {
        const trip = await this.getTripById(id);
        const oldStatus = trip.status;
        const updatePayload = { ...dto };
        if (dto.status === Trip_1.TripStatusEnum.COMPLETED && !dto.actual_completion_time) {
            updatePayload.actual_completion_time = new Date();
        }
        await trip.update(updatePayload);
        if (dto.status && dto.status !== oldStatus) {
            await models_1.TripStatusHistory.create({
                trip_id: trip.id,
                previous_status: oldStatus,
                new_status: dto.status,
                notes: `Trip transitioned to ${dto.status}`,
            });
        }
        // Trigger dead-mileage analysis upon trip completion
        let deadMileageRisk = null;
        if (dto.status === Trip_1.TripStatusEnum.COMPLETED) {
            try {
                const dest = trip.destinationLocation;
                const truck = trip.truck;
                if (dest && truck) {
                    // Update truck location to the trip's destination
                    await truck.update({
                        current_location_id: dest.id,
                    });
                    // Query dead-mileage prediction model
                    deadMileageRisk = await mlClient_1.mlClient.predictDeadMileage({
                        dest_latitude: parseFloat(dest.latitude),
                        dest_longitude: parseFloat(dest.longitude),
                        completion_hour: new Date().getHours(),
                        day_of_week: new Date().getDay(),
                        truck_capacity_tons: parseFloat(truck.capacity_tons),
                    });
                    // If risk is HIGH, mark truck AT_RISK
                    const newTruckStatus = deadMileageRisk.risk_level === 'HIGH'
                        ? Truck_1.TruckStatusEnum.AT_RISK
                        : Truck_1.TruckStatusEnum.AVAILABLE;
                    await truck.update({ status: newTruckStatus });
                    logger_1.logger.info(`Trip ${id} completed. Truck ${truck.id} assigned status: ${newTruckStatus}`);
                }
            }
            catch (err) {
                logger_1.logger.error('Error during post-trip dead-mileage evaluation:', err.message);
            }
        }
        const refreshedTrip = await this.getTripById(id);
        return {
            trip: refreshedTrip,
            dead_mileage_analysis: deadMileageRisk,
        };
    }
}
exports.TripService = TripService;
exports.tripService = new TripService();
