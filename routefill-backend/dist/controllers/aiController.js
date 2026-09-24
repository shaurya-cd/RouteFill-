"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AIController = void 0;
const models_1 = require("../models");
const mlClient_1 = require("../clients/mlClient");
const errors_1 = require("../utils/errors");
/**
 * Controller exposing direct machine learning prediction interfaces.
 */
class AIController {
    /**
     * Uses historical trip patterns, location, timing, and return-load availability
     * to predict the probability that a truck will travel empty after completing its current trip.
     */
    async predictDeadMileageRisk(req, res, next) {
        try {
            const { truck_id, trip_id } = req.body;
            if (!truck_id && !trip_id) {
                throw new errors_1.BadRequestError('Either truck_id or trip_id must be provided');
            }
            let truck = null;
            let destLat = 19.0760;
            let destLon = 72.8777;
            if (trip_id) {
                const trip = await models_1.Trip.findByPk(trip_id, {
                    include: [
                        { model: models_1.Truck, as: 'truck' },
                        { model: models_1.Location, as: 'destinationLocation' },
                    ],
                });
                if (!trip)
                    throw new errors_1.NotFoundError(`Trip ${trip_id} not found`);
                truck = trip.truck;
                if (trip.destinationLocation) {
                    destLat = parseFloat(trip.destinationLocation.latitude);
                    destLon = parseFloat(trip.destinationLocation.longitude);
                }
            }
            else if (truck_id) {
                truck = await models_1.Truck.findByPk(truck_id, {
                    include: [{ model: models_1.Location, as: 'currentLocation' }],
                });
                if (!truck)
                    throw new errors_1.NotFoundError(`Truck ${truck_id} not found`);
                if (truck.currentLocation) {
                    destLat = parseFloat(truck.currentLocation.latitude);
                    destLon = parseFloat(truck.currentLocation.longitude);
                }
            }
            const prediction = await mlClient_1.mlClient.predictDeadMileage({
                dest_latitude: destLat,
                dest_longitude: destLon,
                completion_hour: new Date().getHours(),
                day_of_week: new Date().getDay(),
                truck_capacity_tons: truck ? parseFloat(truck.capacity_tons) : 10.0,
            });
            res.status(200).json({
                success: true,
                data: {
                    truck_id: truck ? truck.id : null,
                    truck_number: truck ? truck.truck_number : null,
                    ...prediction,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AIController = AIController;
exports.aiController = new AIController();
