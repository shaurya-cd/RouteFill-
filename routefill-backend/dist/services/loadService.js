"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadService = exports.LoadService = void 0;
const models_1 = require("../models");
const Load_1 = require("../models/Load");
const geo_1 = require("../utils/geo");
const errors_1 = require("../utils/errors");
const notificationService_1 = require("./notificationService");
const Notification_1 = require("../models/Notification");
/**
 * Service managing freight marketplace loads, geospatial pickup clustering, and status transitions.
 */
class LoadService {
    /**
     * Posts a new load shipment from a verified shipper, broker, or transporter.
     */
    async createLoad(posterId, dto) {
        const pickupLoc = await models_1.Location.findByPk(dto.pickup_location_id);
        if (!pickupLoc) {
            throw new errors_1.NotFoundError(`Pickup location ID ${dto.pickup_location_id} not found`);
        }
        const dropLoc = await models_1.Location.findByPk(dto.destination_location_id);
        if (!dropLoc) {
            throw new errors_1.NotFoundError(`Destination location ID ${dto.destination_location_id} not found`);
        }
        const truckType = await models_1.TruckType.findByPk(dto.truck_type_id);
        if (!truckType) {
            throw new errors_1.NotFoundError(`Truck type ID ${dto.truck_type_id} not found`);
        }
        const load = await models_1.Load.create({
            poster_id: posterId,
            pickup_location_id: dto.pickup_location_id,
            destination_location_id: dto.destination_location_id,
            truck_type_id: dto.truck_type_id,
            weight_tons: dto.weight_tons,
            cargo_description: dto.cargo_description,
            offered_price: dto.offered_price,
            pickup_start_time: new Date(dto.pickup_start_time),
            pickup_end_time: new Date(dto.pickup_end_time),
            status: Load_1.LoadStatusEnum.AVAILABLE,
        });
        return this.getLoadById(load.id);
    }
    /**
     * Retrieves open marketplace loads supporting filters by status, truck type, or poster.
     */
    async getLoads(filter) {
        const where = {};
        if (filter.status)
            where.status = filter.status;
        if (filter.posterId)
            where.poster_id = filter.posterId;
        return models_1.Load.findAll({
            where,
            include: [
                { model: models_1.Location, as: 'pickupLocation' },
                { model: models_1.Location, as: 'destinationLocation' },
                { model: models_1.TruckType, as: 'truckType' },
                { model: models_1.User, as: 'poster', attributes: ['id', 'name', 'email', 'phone'] },
                { model: models_1.Truck, as: 'assignedTruck' },
            ],
            limit: filter.limit || 50,
            order: [['created_at', 'DESC']],
        });
    }
    /**
     * Retrieves details for a specific freight load.
     */
    async getLoadById(id) {
        const load = await models_1.Load.findByPk(id, {
            include: [
                { model: models_1.Location, as: 'pickupLocation' },
                { model: models_1.Location, as: 'destinationLocation' },
                { model: models_1.TruckType, as: 'truckType' },
                { model: models_1.User, as: 'poster', attributes: ['id', 'name', 'email', 'phone'] },
                { model: models_1.Truck, as: 'assignedTruck' },
            ],
        });
        if (!load) {
            throw new errors_1.NotFoundError(`Load with ID ${id} not found`);
        }
        return load;
    }
    /**
     * Finds currently available loads whose pickup locations fall within the requested geographical radius.
     * Uses spherical trigonometry (Haversine formula) to filter candidate locations.
     */
    async findNearbyLoads(latitude, longitude, radiusKm = 150) {
        const availableLoads = await models_1.Load.findAll({
            where: { status: Load_1.LoadStatusEnum.AVAILABLE },
            include: [
                { model: models_1.Location, as: 'pickupLocation' },
                { model: models_1.Location, as: 'destinationLocation' },
                { model: models_1.TruckType, as: 'truckType' },
            ],
        });
        const nearby = availableLoads
            .map((load) => {
            const pickup = load.pickupLocation;
            if (!pickup)
                return null;
            const distance = (0, geo_1.haversineDistance)(latitude, longitude, parseFloat(pickup.latitude), parseFloat(pickup.longitude));
            if (distance <= radiusKm) {
                const raw = load.toJSON();
                return {
                    ...raw,
                    distance_from_query_km: distance,
                };
            }
            return null;
        })
            .filter((item) => item !== null)
            .sort((a, b) => (a?.distance_from_query_km || 0) - (b?.distance_from_query_km || 0));
        return nearby;
    }
    /**
     * Updates an existing load's status, offered price, or assigned vehicle.
     */
    async updateLoad(id, posterId, dto, isAdmin = false) {
        const load = await this.getLoadById(id);
        if (!isAdmin && load.poster_id !== posterId) {
            throw new errors_1.ForbiddenError('Unauthorized: You can only edit loads you posted');
        }
        await load.update(dto);
        return this.getLoadById(id);
    }
    /**
     * Accepts a load for a specific truck and notifies the shipper.
     */
    async acceptLoad(loadId, carrierUser, truckId, recommendationId) {
        const load = await this.getLoadById(loadId);
        const truck = await models_1.Truck.findByPk(truckId, {
            include: [{ model: models_1.User, as: 'owner' }],
        });
        if (!truck) {
            throw new errors_1.NotFoundError(`Truck ID ${truckId} not found`);
        }
        // Update load status to ASSIGNED and assign truck
        await load.update({
            status: Load_1.LoadStatusEnum.ASSIGNED,
            assigned_truck_id: truck.id,
        });
        // Update truck status to ON_TRIP
        await truck.update({
            status: 'ON_TRIP',
        });
        const pickupCity = load.pickupLocation?.city || load.pickupLocation?.name || 'Pickup';
        const dropCity = load.destinationLocation?.city || load.destinationLocation?.name || 'Destination';
        // Dispatch notification to the Shipper (poster_id)
        await notificationService_1.notificationService.createNotification({
            userId: load.poster_id,
            title: 'Load Accepted! 🚛',
            message: `${truck.truck_number} (${carrierUser.name}) accepted your freight shipment (${pickupCity} → ${dropCity}, ${load.weight_tons}T, ₹${Number(load.offered_price).toLocaleString('en-IN')}).`,
            type: Notification_1.NotificationTypeEnum.LOAD_ACCEPTED,
            data: {
                load_id: load.id,
                truck_id: truck.id,
                truck_number: truck.truck_number,
                carrier_id: carrierUser.id,
                carrier_name: carrierUser.name,
                recommendation_id: recommendationId || null,
                status: 'ASSIGNED',
                offered_price: load.offered_price,
                pickup_city: pickupCity,
                drop_city: dropCity,
            },
        });
        return {
            load: await this.getLoadById(loadId),
            truck,
            message: `Load #${loadId} accepted by ${truck.truck_number}`,
        };
    }
    /**
     * Cancels or removes an active load posting.
     */
    async deleteLoad(id, posterId, isAdmin = false) {
        const load = await this.getLoadById(id);
        if (!isAdmin && load.poster_id !== posterId) {
            throw new errors_1.ForbiddenError('Unauthorized: You can only delete loads you posted');
        }
        await load.destroy();
        return { success: true, message: `Load ${id} cancelled successfully` };
    }
}
exports.LoadService = LoadService;
exports.loadService = new LoadService();
